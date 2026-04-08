import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { API_KEY_PREFIX, API_KEY_BYTES } from '@/config/constants';

export const apiKeyService = {
  /**
   * Create a new API key. Returns the plaintext key once — it cannot be retrieved again.
   */
  async create(
    auth: AuthContext,
    data: { name: string; expiresAt?: Date },
  ) {
    const rawKey = `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_BYTES).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 15); // "adb_sk_" + first 8 hex chars

    const apiKey = await prisma.apiKey.create({
      data: {
        orgId: auth.orgId,
        createdById: auth.userId,
        name: data.name,
        keyPrefix,
        keyHash,
        expiresAt: data.expiresAt ?? null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      key: rawKey, // Only returned on creation
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  },

  /**
   * List API keys for an organization (masked — no key values).
   */
  async list(orgId: string) {
    return prisma.apiKey.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        createdById: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Revoke (soft-delete) an API key.
   */
  async revoke(orgId: string, keyId: string) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key || key.orgId !== orgId) return null;

    return prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  },
};
