import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { UpdateTaskSchema } from '@/lib/schemas/task.schema';
import { logActivity, paginatedQuery, PaginatedResult, resolveProject, toJsonInput } from './_helpers';

export const taskService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      title: string;
      description?: string;
      featureId?: string;
      status?: string;
      priority?: string;
      sortOrder?: number;
      dependsOn?: string[];
      tags?: string[];
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        featureId: data.featureId ?? null,
        title: data.title,
        description: data.description ?? null,
        status: (data.status as 'TODO') ?? 'TODO',
        priority: (data.priority as 'P2') ?? 'P2',
        sortOrder: data.sortOrder ?? 0,
        dependsOn: data.dependsOn ?? [],
        tags: data.tags ?? [],
        metadata: toJsonInput(data.metadata),
      },
    });

    await logActivity(
      auth,
      project.id,
      'task.created',
      'task',
      task.id,
      `Created task "${task.title}"`,
    );

    return task;
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: {
      status?: string;
      featureId?: string;
      priority?: string;
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: Prisma.TaskWhereInput = { projectId: project.id };
    if (filters?.status) where.status = filters.status as Prisma.EnumTaskStatusFilter;
    if (filters?.featureId) where.featureId = filters.featureId;
    if (filters?.priority) where.priority = filters.priority as Prisma.EnumPriorityFilter;
    if (filters?.tags?.length) where.tags = { hasSome: filters.tags };
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.task, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: [{ priority: 'asc' }, { sortOrder: 'asc' }],
      include: { feature: { select: { id: true, title: true } } },
    });
  },

  async get(orgId: string, projectSlug: string, taskId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
      include: {
        feature: { select: { id: true, title: true } },
      },
    });
    if (!task) return null;

    // Resolve dependencies and blockers in parallel
    const [dependsOnTasks, blocks] = await Promise.all([
      (task.dependsOn || []).length > 0
        ? prisma.task.findMany({
            where: { id: { in: task.dependsOn }, projectId: project.id },
            select: { id: true, title: true, status: true, priority: true },
            orderBy: { sortOrder: 'asc' },
          })
        : Promise.resolve([]),
      prisma.task.findMany({
        where: { projectId: project.id, dependsOn: { has: taskId } },
        select: { id: true, title: true, status: true, priority: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return { ...task, dependsOnTasks, blocks };
  },

  async update(
    auth: AuthContext,
    projectSlug: string,
    taskId: string,
    data: Record<string, unknown>,
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });
    if (!existing) return null;

    const validated = UpdateTaskSchema.parse(data);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validated,
        metadata: toJsonInput(validated.metadata),
        // Auto-set completedAt when status changes to DONE
        ...(validated.status === 'DONE' && existing.status !== 'DONE'
          ? { completedAt: new Date() }
          : {}),
      },
    });

    await logActivity(
      auth,
      project.id,
      'task.updated',
      'task',
      task.id,
      `Updated task "${task.title}"`,
    );

    return task;
  },

  async complete(auth: AuthContext, projectSlug: string, taskId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });
    if (!existing) return null;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'DONE', completedAt: new Date() },
    });

    await logActivity(
      auth,
      project.id,
      'task.completed',
      'task',
      task.id,
      `Completed task "${task.title}"`,
    );

    return task;
  },

  async delete(auth: AuthContext, projectSlug: string, taskId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });
    if (!task) return null;

    await prisma.task.delete({ where: { id: taskId } });

    await logActivity(
      auth,
      project.id,
      'task.deleted',
      'task',
      taskId,
      `Deleted task "${task.title}"`,
    );

    return task;
  },

  async search(orgId: string, projectSlug: string, query: string, limit = 20) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Simple ILIKE search for now — upgraded to tsvector in Slice 11
    return prisma.task.findMany({
      where: {
        projectId: project.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        feature: { select: { id: true, title: true } },
      },
      take: safeLimit,
      orderBy: { updatedAt: 'desc' },
    });
  },
};
