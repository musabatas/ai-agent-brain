import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { API_KEY_PREFIX } from '@/config/constants';
import prisma from '@/lib/prisma';

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthContext {
  userId: string;
  orgId: string;
  orgRole: OrgRole;
  authType: 'session' | 'api-key';
  apiKeyId?: string;
}

/**
 * Dual auth: resolves Bearer API key OR session + org header.
 * Returns null if unauthenticated or user is not a member of the resolved org.
 */
export async function getAuthContext(
  req: NextRequest,
): Promise<AuthContext | null> {
  // 1. Try API key auth first (fast path for MCP/programmatic)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.slice(7);
    if (rawKey.startsWith(API_KEY_PREFIX)) {
      return resolveApiKey(rawKey);
    }
  }

  // 2. Fall back to session auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Resolve org from header, cookie, query param, or auto-detect
  const orgId =
    req.headers.get('x-org-id') ||
    req.cookies.get('adb-org-id')?.value ||
    new URL(req.url).searchParams.get('orgId') ||
    (await autoResolveOrg(userId));

  if (!orgId) return null;

  // Verify user belongs to this org and get their role
  const membership = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { role: true },
  });
  if (!membership) return null;

  return {
    userId,
    orgId,
    orgRole: membership.role as OrgRole,
    authType: 'session',
  };
}

/**
 * Lighter auth variant — resolves user identity without org context.
 * Use for routes that don't need org scoping (e.g., listing user's orgs).
 */
export async function getUserFromRequest(
  req: NextRequest,
): Promise<{ userId: string; authType: 'session' | 'api-key' } | null> {
  // Try API key
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.slice(7);
    if (rawKey.startsWith(API_KEY_PREFIX)) {
      const ctx = await resolveApiKey(rawKey);
      return ctx ? { userId: ctx.userId, authType: 'api-key' } : null;
    }
  }

  // Fall back to session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { userId: session.user.id, authType: 'session' };
}

/**
 * Check if the auth context has admin/owner role in the org.
 */
export function isOrgAdmin(auth: AuthContext): boolean {
  return auth.orgRole === 'OWNER' || auth.orgRole === 'ADMIN';
}

async function resolveApiKey(rawKey: string): Promise<AuthContext | null> {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Verify the key creator is still a member of the org
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: { orgId: apiKey.orgId, userId: apiKey.createdById },
    },
    select: { role: true },
  });

  if (!membership) return null; // User removed from org → key is dead

  // Update last used (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    userId: apiKey.createdById,
    orgId: apiKey.orgId,
    orgRole: membership.role as OrgRole,
    authType: 'api-key',
    apiKeyId: apiKey.id,
  };
}

async function autoResolveOrg(userId: string): Promise<string | null> {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    select: { orgId: true },
    take: 2,
  });

  // Auto-resolve only if user belongs to exactly one org
  if (memberships.length === 1) {
    return memberships[0].orgId;
  }

  return null;
}
