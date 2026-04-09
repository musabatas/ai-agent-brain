import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { PAGINATION, SLUG_SUFFIX_LENGTH } from '@/config/constants';

/**
 * Paginated response shape for list endpoints.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Generic paginated query — runs findMany + count in parallel.
 */
export async function paginatedQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
  where: object,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: object | object[];
    include?: object;
  },
): Promise<PaginatedResult<T>> {
  const limit = Math.min(options.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const offset = options.offset ?? 0;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      ...(options.include ? { include: options.include } : {}),
      orderBy: options.orderBy,
      take: limit,
      skip: offset,
    }),
    model.count({ where }),
  ]);

  return {
    data,
    pagination: { total, limit, offset, hasMore: offset + data.length < total },
  };
}

/**
 * Cast metadata to Prisma-compatible JSON input.
 */
export function toJsonInput(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

/**
 * Resolve a project by slug or ID within an organization.
 */
export async function resolveProject(orgId: string, slugOrId: string) {
  return prisma.project.findFirst({
    where: {
      orgId,
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
  });
}

/**
 * Generate a URL-safe slug from a name.
 * Appends a short random suffix to avoid collisions.
 */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.random().toString(36).slice(2, 2 + SLUG_SUFFIX_LENGTH);
  return `${base}-${suffix}`;
}

/**
 * Log an activity event for a project.
 */
export async function logActivity(
  auth: AuthContext,
  projectId: string,
  action: string,
  entityType: string,
  entityId: string,
  summary?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.activity.create({
    data: {
      projectId,
      actorType: auth.authType === 'api-key' ? 'mcp' : 'user',
      actorId: auth.apiKeyId || auth.userId,
      action,
      entityType,
      entityId,
      summary,
      metadata: toJsonInput(metadata),
    },
  });
}
