import prisma from '@/lib/prisma';
import { slugify } from './_helpers';

export const orgService = {
  async create(userId: string, data: { name: string; slug?: string }) {
    const slug = data.slug || slugify(data.name);

    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
        },
      });

      return org;
    });
  },

  async list(userId: string) {
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          include: {
            _count: { select: { members: true, projects: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.org,
      memberRole: m.role,
      memberCount: m.org._count.members,
      projectCount: m.org._count.projects,
    }));
  },

  async get(orgId: string) {
    return prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { projects: true, apiKeys: true } },
      },
    });
  },

  async update(orgId: string, data: { name?: string; slug?: string; avatarUrl?: string | null }) {
    return prisma.organization.update({
      where: { id: orgId },
      data,
    });
  },

  async delete(orgId: string) {
    return prisma.organization.delete({ where: { id: orgId } });
  },

  async addMember(orgId: string, email: string, role: 'ADMIN' | 'MEMBER') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const existing = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    });
    if (existing) return { alreadyMember: true as const };

    return prisma.orgMember.create({
      data: { orgId, userId: user.id, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  },

  async removeMember(orgId: string, memberId: string) {
    const member = await prisma.orgMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.orgId !== orgId) return null;
    if (member.role === 'OWNER') return { isOwner: true };

    return prisma.orgMember.delete({ where: { id: memberId } });
  },

  async updateMemberRole(orgId: string, memberId: string, role: string) {
    const member = await prisma.orgMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.orgId !== orgId) return null;

    return prisma.orgMember.update({
      where: { id: memberId },
      data: { role: role as 'OWNER' | 'ADMIN' | 'MEMBER' },
    });
  },

  async getMemberRole(orgId: string, userId: string) {
    const member = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    return member?.role ?? null;
  },
};
