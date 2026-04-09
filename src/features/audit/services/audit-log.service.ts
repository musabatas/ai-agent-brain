import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { paginatedQuery } from '@/lib/services/_helpers';

export const auditLogService = {
  async log(data: {
    orgId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        orgId: data.orgId,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        before: data.before as Prisma.InputJsonValue ?? Prisma.JsonNull,
        after: data.after as Prisma.InputJsonValue ?? Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  },

  async list(
    orgId: string,
    filters?: {
      actorId?: string;
      entityType?: string;
      action?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = { orgId };
    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };

    return paginatedQuery(prisma.auditLog, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
  },
};
