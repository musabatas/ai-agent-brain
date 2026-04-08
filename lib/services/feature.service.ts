import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { logActivity, paginatedQuery, PaginatedResult, resolveProject, toJsonInput } from './_helpers';

export const featureService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      title: string;
      description?: string;
      plan?: string;
      status?: string;
      priority?: string;
      sortOrder?: number;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const feature = await prisma.feature.create({
      data: {
        projectId: project.id,
        title: data.title,
        description: data.description ?? null,
        plan: data.plan ?? null,
        status: (data.status as 'BACKLOG') ?? 'BACKLOG',
        priority: (data.priority as 'P2') ?? 'P2',
        sortOrder: data.sortOrder ?? 0,
        metadata: toJsonInput(data.metadata),
      },
    });

    await logActivity(
      auth,
      project.id,
      'feature.created',
      'feature',
      feature.id,
      `Created feature "${feature.title}"`,
    );

    return feature;
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: { status?: string; priority?: string; search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedResult<any> | null> {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: any = { projectId: project.id };
    if (filters?.status) where.status = filters.status as 'BACKLOG';
    if (filters?.priority) where.priority = filters.priority as 'P2';
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.feature, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
    });
  },

  async get(orgId: string, projectSlug: string, featureId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.feature.findFirst({
      where: { id: featureId, projectId: project.id },
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  async update(
    auth: AuthContext,
    projectSlug: string,
    featureId: string,
    data: Record<string, unknown>,
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.feature.findFirst({
      where: { id: featureId, projectId: project.id },
    });
    if (!existing) return null;

    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: data as Parameters<typeof prisma.feature.update>[0]['data'],
    });

    await logActivity(
      auth,
      project.id,
      'feature.updated',
      'feature',
      feature.id,
      `Updated feature "${feature.title}"`,
    );

    return feature;
  },

  async delete(auth: AuthContext, projectSlug: string, featureId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const feature = await prisma.feature.findFirst({
      where: { id: featureId, projectId: project.id },
    });
    if (!feature) return null;

    await prisma.feature.delete({ where: { id: featureId } });

    await logActivity(
      auth,
      project.id,
      'feature.deleted',
      'feature',
      featureId,
      `Deleted feature "${feature.title}"`,
    );

    return feature;
  },
};
