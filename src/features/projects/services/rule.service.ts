import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AuthContext } from '@/lib/auth';
import { UpdateRuleSchema } from '@/lib/schemas/rule.schema';
import { logActivity, paginatedQuery, PaginatedResult, resolveProject, toJsonInput } from './_helpers';

export const ruleService = {
  async create(
    auth: AuthContext,
    projectSlug: string,
    data: {
      title: string;
      content: string;
      scope?: string;
      enforcement?: string;
      isActive?: boolean;
      tags?: string[];
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const rule = await prisma.rule.create({
      data: {
        projectId: project.id,
        title: data.title,
        content: data.content,
        scope: (data.scope as 'GLOBAL') ?? 'GLOBAL',
        enforcement: (data.enforcement as 'SHOULD') ?? 'SHOULD',
        isActive: data.isActive ?? true,
        tags: data.tags ?? [],
        metadata: toJsonInput(data.metadata),
      },
    });

    await logActivity(auth, project.id, 'rule.created', 'rule', rule.id, `Created rule "${rule.title}"`);

    return rule;
  },

  async list(
    orgId: string,
    projectSlug: string,
    filters?: { scope?: string; isActive?: boolean; search?: string; limit?: number; offset?: number },
  ) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    const where: Prisma.RuleWhereInput = { projectId: project.id };
    if (filters?.scope) where.scope = filters.scope as Prisma.EnumRuleScopeFilter;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return paginatedQuery(prisma.rule, where, {
      limit: filters?.limit,
      offset: filters?.offset,
      orderBy: [{ scope: 'asc' }, { enforcement: 'asc' }],
    });
  },

  async get(orgId: string, projectSlug: string, ruleId: string) {
    const project = await resolveProject(orgId, projectSlug);
    if (!project) return null;

    return prisma.rule.findFirst({
      where: { id: ruleId, projectId: project.id },
    });
  },

  async update(auth: AuthContext, projectSlug: string, ruleId: string, data: Record<string, unknown>) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const existing = await prisma.rule.findFirst({ where: { id: ruleId, projectId: project.id } });
    if (!existing) return null;

    const validated = UpdateRuleSchema.parse(data);

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...validated,
        metadata: toJsonInput(validated.metadata),
      },
    });

    await logActivity(auth, project.id, 'rule.updated', 'rule', rule.id, `Updated rule "${rule.title}"`);

    return rule;
  },

  async activate(auth: AuthContext, projectSlug: string, ruleId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: { isActive: true },
    });

    await logActivity(auth, project.id, 'rule.activated', 'rule', rule.id, `Activated rule "${rule.title}"`);

    return rule;
  },

  async deactivate(auth: AuthContext, projectSlug: string, ruleId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });

    await logActivity(auth, project.id, 'rule.deactivated', 'rule', rule.id, `Deactivated rule "${rule.title}"`);

    return rule;
  },

  async delete(auth: AuthContext, projectSlug: string, ruleId: string) {
    const project = await resolveProject(auth.orgId, projectSlug);
    if (!project) return null;

    const rule = await prisma.rule.findFirst({ where: { id: ruleId, projectId: project.id } });
    if (!rule) return null;

    await prisma.rule.delete({ where: { id: ruleId } });
    await logActivity(auth, project.id, 'rule.deleted', 'rule', ruleId, `Deleted rule "${rule.title}"`);

    return rule;
  },
};
