import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { resolveProject } from './_helpers';

export const revisionService = {
  /**
   * Snapshot the current state of an entity before an update.
   * Called automatically from update operations.
   */
  async snapshot(
    auth: AuthContext,
    projectSlug: string,
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    // Get next version number
    const lastRevision = await prisma.revision.findFirst({
      where: { projectId: project.id, entityType, entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (lastRevision?.version ?? 0) + 1;

    return prisma.revision.create({
      data: {
        projectId: project.id,
        entityType,
        entityId,
        version,
        data: data as Prisma.InputJsonValue,
        authorId: auth.userId,
      },
    });
  },

  /**
   * List all revisions for an entity.
   */
  async list(orgId: string, projectSlug: string, entityType: string, entityId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.revision.findMany({
      where: { projectId: project.id, entityType, entityId },
      orderBy: { version: 'desc' },
      take: 50,
    });
  },

  /**
   * Get a specific revision.
   */
  async get(orgId: string, projectSlug: string, entityType: string, entityId: string, version: number) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.revision.findUnique({
      where: {
        projectId_entityType_entityId_version: {
          projectId: project.id,
          entityType,
          entityId,
          version,
        },
      },
    });
  },
};
