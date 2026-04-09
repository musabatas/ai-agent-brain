import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { logActivity, slugify, toJsonInput } from '@/lib/services/_helpers';

export const projectService = {
  async create(
    auth: AuthContext,
    data: { name: string; description?: string; slug?: string },
  ) {
    const slug = data.slug || slugify(data.name);

    const project = await prisma.project.create({
      data: {
        orgId: auth.orgId,
        name: data.name,
        slug,
        description: data.description ?? null,
      },
    });

    await logActivity(
      auth,
      project.id,
      'project.created',
      'project',
      project.id,
      `Created project "${project.name}"`,
    );

    return project;
  },

  async list(orgId: string, status?: string) {
    return prisma.project.findMany({
      where: {
        orgId,
        ...(status ? { status: status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED' } : {}),
      },
      include: {
        _count: {
          select: { features: true, tasks: true, decisions: true, rules: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getBySlug(orgId: string, slug: string) {
    return prisma.project.findFirst({
      where: {
        orgId,
        OR: [{ slug }, { id: slug }],
      },
    });
  },

  async update(
    auth: AuthContext,
    projectId: string,
    data: {
      name?: string;
      description?: string | null;
      status?: string;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && {
          status: data.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
        }),
        ...(data.metadata !== undefined && { metadata: toJsonInput(data.metadata) }),
      },
    });

    await logActivity(
      auth,
      project.id,
      'project.updated',
      'project',
      project.id,
      `Updated project "${project.name}"`,
    );

    return project;
  },

  async archive(auth: AuthContext, projectId: string) {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
    });

    await logActivity(
      auth,
      project.id,
      'project.archived',
      'project',
      project.id,
      `Archived project "${project.name}"`,
    );

    return project;
  },
};
