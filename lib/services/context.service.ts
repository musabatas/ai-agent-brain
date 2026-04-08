import prisma from '@/lib/prisma';
import { resolveProject } from './_helpers';

export const contextService = {
  /**
   * Full project context dump for AI onboarding.
   * Returns everything an AI agent needs to understand the project in one call.
   */
  async onboard(orgId: string, projectSlug: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const [features, openTasks, decisions, rules, memory, activity] =
      await Promise.all([
        // Active features with task counts
        prisma.feature.findMany({
          where: {
            projectId: project.id,
            status: { not: 'CANCELLED' },
          },
          include: {
            tasks: { select: { status: true } },
          },
          orderBy: [{ priority: 'asc' }, { sortOrder: 'asc' }],
        }),

        // Open tasks (not done/cancelled)
        prisma.task.findMany({
          where: {
            projectId: project.id,
            status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
          },
          include: {
            feature: { select: { id: true, title: true } },
          },
          orderBy: [{ priority: 'asc' }, { sortOrder: 'asc' }],
          take: 100,
        }),

        // Accepted decisions
        prisma.decision.findMany({
          where: {
            projectId: project.id,
            status: 'ACCEPTED',
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Active rules
        prisma.rule.findMany({
          where: {
            projectId: project.id,
            isActive: true,
          },
          orderBy: [{ enforcement: 'asc' }, { scope: 'asc' }],
        }),

        // Recent memory entries
        prisma.memory.findMany({
          where: { projectId: project.id },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),

        // Recent activity
        prisma.activity.findMany({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    // Enrich features with task counts
    const enrichedFeatures = features.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      status: f.status,
      priority: f.priority,
      taskCount: f.tasks.length,
      doneCount: f.tasks.filter((t) => t.status === 'DONE').length,
    }));

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        status: project.status,
      },
      features: enrichedFeatures,
      openTasks,
      acceptedDecisions: decisions,
      activeRules: rules,
      recentMemory: memory,
      recentActivity: activity,
    };
  },

  /**
   * Quick project status summary — counts + recent activity.
   */
  async summary(orgId: string, projectSlug: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const [featureCounts, taskCounts, decisionCount, ruleCount, memoryCount, recentActivity] =
      await Promise.all([
        prisma.feature.groupBy({
          by: ['status'],
          where: { projectId: project.id },
          _count: true,
        }),
        prisma.task.groupBy({
          by: ['status'],
          where: { projectId: project.id },
          _count: true,
        }),
        prisma.decision.count({ where: { projectId: project.id } }),
        prisma.rule.count({ where: { projectId: project.id, isActive: true } }),
        prisma.memory.count({ where: { projectId: project.id } }),
        prisma.activity.findMany({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
      },
      counts: {
        features: Object.fromEntries(featureCounts.map((f) => [f.status, f._count])),
        tasks: Object.fromEntries(taskCounts.map((t) => [t.status, t._count])),
        decisions: decisionCount,
        activeRules: ruleCount,
        memory: memoryCount,
      },
      recentActivity,
    };
  },

  /**
   * Current work focus — in-progress features + in-progress/blocked tasks.
   */
  async focus(orgId: string, projectSlug: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const [activeFeatures, activeTasks] = await Promise.all([
      prisma.feature.findMany({
        where: {
          projectId: project.id,
          status: 'IN_PROGRESS',
        },
        include: {
          tasks: {
            where: { status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } },
            orderBy: [{ priority: 'asc' }, { sortOrder: 'asc' }],
          },
        },
        orderBy: [{ priority: 'asc' }],
      }),
      prisma.task.findMany({
        where: {
          projectId: project.id,
          status: { in: ['IN_PROGRESS', 'BLOCKED'] },
        },
        include: {
          feature: { select: { id: true, title: true } },
        },
        orderBy: [{ priority: 'asc' }],
      }),
    ]);

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      activeFeatures,
      activeTasks,
    };
  },
};
