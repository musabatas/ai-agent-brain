import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface SystemLogProps {
  event: string;
  userId: string;
  entityId?: string;
  entityType?: string;
  description?: string;
  ipAddress?: string;
  meta?: string;
}

export async function systemLog(
  {
    event,
    userId,
    entityId,
    entityType,
    description,
    ipAddress,
    meta,
  }: SystemLogProps,
  tx?: Prisma.TransactionClient, // Optional transaction
) {
  try {
    // Use transaction if available, otherwise use Prisma client
    const connection = tx ?? prisma;

    await connection.systemLog.create({
      data: {
        event,
        userId,
        entityId,
        entityType,
        description,
        ipAddress,
        meta,
      },
    });
  } catch (error) {
    console.error('[LOG] Failed to log activity:', error);
  }
}
