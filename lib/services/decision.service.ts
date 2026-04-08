import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { logActivity, paginatedQuery, PaginatedResult, resolveProject, toJsonInput } from './_helpers';

export const decisionService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      title: string;
      status?: string;
      context: string;
      decision: string;
      alternatives?: Record<string, unknown>[];
      consequences?: string;
      tags?: string[];
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const record = await prisma.decision.create({
      data: {
        projectId: project.id,
        title: data.title,
        status: (data.status as 'PROPOSED') ?? 'PROPOSED',
        context: data.context,
        decision: data.decision,
        alternatives: data.alternatives
          ? (data.alternatives as unknown as Prisma.InputJsonValue)
          : undefined,
        consequences: data.consequences ?? null,
        tags: data.tags ?? [],
        metadata: toJsonInput(data.metadata),
      },
    });

    await logActivity(
      auth,
      project.id,
      'decision.created',
      'decision',
      record.id,
      `Recorded decision "${record.title}"`,
    );

    return record;
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: { status?: string; tags?: string[]; search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedResult<any> | null> {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: any = { projectId: project.id };
    if (filters?.status) where.status = filters.status as 'PROPOSED';
    if (filters?.tags?.length) where.tags = { hasSome: filters.tags };
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { context: { contains: filters.search, mode: 'insensitive' } },
        { decision: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.decision, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
  },

  async get(orgId: string, projectSlug: string, decisionId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.decision.findFirst({
      where: { id: decisionId, projectId: project.id },
    });
  },

  async update(
    auth: AuthContext,
    projectSlug: string,
    decisionId: string,
    data: Record<string, unknown>,
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.decision.findFirst({
      where: { id: decisionId, projectId: project.id },
    });
    if (!existing) return null;

    const record = await prisma.decision.update({
      where: { id: decisionId },
      data: data as Parameters<typeof prisma.decision.update>[0]['data'],
    });

    await logActivity(
      auth,
      project.id,
      'decision.updated',
      'decision',
      record.id,
      `Updated decision "${record.title}"`,
    );

    return record;
  },

  async supersede(
    auth: AuthContext,
    projectSlug: string,
    decisionId: string,
    newDecisionId: string,
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const record = await prisma.decision.update({
      where: { id: decisionId },
      data: { status: 'SUPERSEDED', supersededById: newDecisionId },
    });

    await logActivity(
      auth,
      project.id,
      'decision.superseded',
      'decision',
      record.id,
      `Superseded decision "${record.title}"`,
    );

    return record;
  },

  async delete(auth: AuthContext, projectSlug: string, decisionId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const record = await prisma.decision.findFirst({
      where: { id: decisionId, projectId: project.id },
    });
    if (!record) return null;

    await prisma.decision.delete({ where: { id: decisionId } });

    await logActivity(auth, project.id, 'decision.deleted', 'decision', decisionId, `Deleted decision "${record.title}"`);

    return record;
  },

  async search(orgId: string, projectSlug: string, query: string, limit = 20) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.decision.findMany({
      where: {
        projectId: project.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { context: { contains: query, mode: 'insensitive' } },
          { decision: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  },
};
