import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { UpdateDocumentSchema } from '@/features/projects/schemas/document.schema';
import { logActivity, paginatedQuery, resolveProject, toJsonInput } from '@/lib/services/_helpers';

export const documentService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      title: string;
      content: string;
      type?: string;
      tags?: string[];
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const doc = await prisma.document.create({
      data: {
        projectId: project.id,
        title: data.title,
        content: data.content,
        type: (data.type as 'NOTE') ?? 'NOTE',
        tags: data.tags ?? [],
        metadata: toJsonInput(data.metadata),
      },
    });

    await logActivity(auth, project.id, 'document.created', 'document', doc.id, `Created document "${doc.title}"`);

    return doc;
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: { type?: string; tags?: string[]; search?: string; limit?: number; offset?: number },
  ) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: Prisma.DocumentWhereInput = { projectId: project.id };
    if (filters?.type) where.type = filters.type as Prisma.EnumDocumentTypeFilter;
    if (filters?.tags?.length) where.tags = { hasSome: filters.tags };
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.document, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async get(orgId: string, projectSlug: string, docId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.document.findFirst({
      where: { id: docId, projectId: project.id },
    });
  },

  async update(auth: AuthContext, projectSlug: string, docId: string, data: Record<string, unknown>) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.document.findFirst({ where: { id: docId, projectId: project.id } });
    if (!existing) return null;

    const validated = UpdateDocumentSchema.parse(data);

    const doc = await prisma.document.update({
      where: { id: docId },
      data: {
        ...validated,
        metadata: toJsonInput(validated.metadata),
      },
    });

    await logActivity(auth, project.id, 'document.updated', 'document', doc.id, `Updated document "${doc.title}"`);

    return doc;
  },

  async delete(auth: AuthContext, projectSlug: string, docId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const doc = await prisma.document.findFirst({ where: { id: docId, projectId: project.id } });
    if (!doc) return null;

    await prisma.document.delete({ where: { id: docId } });
    await logActivity(auth, project.id, 'document.deleted', 'document', docId, `Deleted document "${doc.title}"`);

    return doc;
  },

  async search(orgId: string, projectSlug: string, query: string, limit = 20) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const safeLimit = Math.min(Math.max(1, limit), 100);

    return prisma.document.findMany({
      where: {
        projectId: project.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: safeLimit,
      orderBy: { updatedAt: 'desc' },
    });
  },
};
