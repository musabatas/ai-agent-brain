import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { logActivity, paginatedQuery, resolveProject } from '@/lib/services/_helpers';

export const commentService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      entityType: string;
      entityId: string;
      content: string;
      parentId?: string;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const comment = await prisma.comment.create({
      data: {
        projectId: project.id,
        authorId: auth.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        content: data.content,
        parentId: data.parentId ?? null,
      },
    });

    await logActivity(
      auth,
      project.id,
      'comment.created',
      data.entityType,
      data.entityId,
      `Added comment on ${data.entityType}`,
    );

    return comment;
  },

  async list(
    orgId: string,
    projectSlug: string,
    entityType: string,
    entityId: string,
    filters?: { limit?: number; offset?: number },
  ) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: Prisma.CommentWhereInput = {
      projectId: project.id,
      entityType,
      entityId,
      parentId: null, // Top-level comments only
    };

    return paginatedQuery(prisma.comment, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { createdAt: 'asc' },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async delete(auth: AuthContext, projectSlug: string, commentId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, projectId: project.id },
    });
    if (!comment) return null;

    // Only author can delete their own comments
    if (comment.authorId !== auth.userId && auth.orgRole === 'MEMBER') {
      return { forbidden: true as const };
    }

    await prisma.comment.delete({ where: { id: commentId } });

    await logActivity(
      auth,
      project.id,
      'comment.deleted',
      comment.entityType,
      comment.entityId,
      'Deleted comment',
    );

    return comment;
  },
};
