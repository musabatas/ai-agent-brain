import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { logActivity, paginatedQuery, PaginatedResult, resolveProject } from './_helpers';

export const memoryService = {
  async upsert(
    auth: AuthContext,
    projectSlug: string,
    data: {
      key: string;
      value: string;
      type?: string;
      tags?: string[];
      expiresAt?: Date | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const memory = await prisma.memory.upsert({
      where: {
        projectId_key: { projectId: project.id, key: data.key },
      },
      create: {
        projectId: project.id,
        key: data.key,
        value: data.value,
        type: (data.type as 'PROJECT') ?? 'PROJECT',
        tags: data.tags ?? [],
        expiresAt: data.expiresAt ?? null,
      },
      update: {
        value: data.value,
        ...(data.type ? { type: data.type as 'PROJECT' } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
      },
    });

    await logActivity(auth, project.id, 'memory.stored', 'memory', memory.id, `Stored memory "${data.key}"`);

    return memory;
  },

  async recall(orgId: string, projectSlug: string, key: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.memory.findUnique({
      where: {
        projectId_key: { projectId: project.id, key },
      },
    });
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: { type?: string; search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedResult<any> | null> {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: any = { projectId: project.id };
    if (filters?.type) where.type = filters.type as 'PROJECT';
    if (filters?.search) {
      where.OR = [
        { key: { contains: filters.search, mode: 'insensitive' } },
        { value: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.memory, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async delete(auth: AuthContext, projectSlug: string, key: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const memory = await prisma.memory.findUnique({
      where: { projectId_key: { projectId: project.id, key } },
    });
    if (!memory) return null;

    await prisma.memory.delete({
      where: { projectId_key: { projectId: project.id, key } },
    });

    await logActivity(auth, project.id, 'memory.deleted', 'memory', memory.id, `Deleted memory "${key}"`);

    return memory;
  },

  async search(orgId: string, projectSlug: string, query: string, limit = 20) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.memory.findMany({
      where: {
        projectId: project.id,
        OR: [
          { key: { contains: query, mode: 'insensitive' } },
          { value: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  },
};
