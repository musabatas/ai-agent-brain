import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { UpdateFeatureSchema } from '@/features/projects/schemas/feature.schema';
import { logActivity, paginatedQuery, resolveProject, toJsonInput } from '@/lib/services/_helpers';

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
  ) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: Prisma.FeatureWhereInput = { projectId: project.id };
    if (filters?.status) where.status = filters.status as Prisma.EnumFeatureStatusFilter;
    if (filters?.priority) where.priority = filters.priority as Prisma.EnumPriorityFilter;
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

    const validated = UpdateFeatureSchema.parse(data);

    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        ...validated,
        metadata: toJsonInput(validated.metadata),
      },
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

  async search(orgId: string, projectSlug: string, query: string, limit = 20) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const safeLimit = Math.min(Math.max(1, limit), 100);

    return prisma.feature.findMany({
      where: {
        projectId: project.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: { select: { tasks: true } },
      },
      take: safeLimit,
      orderBy: { updatedAt: 'desc' },
    });
  },
};
