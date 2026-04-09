import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { paginatedQuery } from './_helpers';

export const notificationService = {
  async create(data: {
    userId: string;
    orgId: string;
    type: string;
    title: string;
    message?: string;
    entityType?: string;
    entityId?: string;
    projectId?: string;
  }) {
    return prisma.notification.create({ data });
  },

  async list(userId: string, filters?: { isRead?: boolean; limit?: number; offset?: number }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;

    return paginatedQuery(prisma.notification, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
