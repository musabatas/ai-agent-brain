import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { isUnique } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  RoleSchema,
  RoleSchemaType,
} from '@/app/(protected)/user-management/roles/forms/role-schema';

// GET: Fetch all roles with permissions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const query = searchParams.get('query') || '';
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const skip = (page - 1) * limit;

  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    // Count total records matching the filter
    const total = await prisma.userRole.count({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });

    let isTableEmpty = false;

    if (total === 0) {
      // Check if the entire table is empty
      const overallTotal = await prisma.userRole.count();
      isTableEmpty = overallTotal === 0;
    }

    // Get paginated roles with their permissions
    const roles =
      total > 0
        ? await prisma.userRole.findMany({
            skip,
            take: limit,
            where: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            orderBy: {
              [sortField]: sortDirection,
            },
            include: {
              permissions: {
                select: {
                  permission: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    type RoleWithPermissions = (typeof roles)[number];
    type RolePermissionItem = NonNullable<RoleWithPermissions['permissions']>[number];
    // Map permissions into a more straightforward structure
    const formattedRoles = roles.map((role: RoleWithPermissions) => ({
      ...role,
      permissions: role.permissions?.map((rp: RolePermissionItem) => rp.permission),
    }));

    return NextResponse.json({
      data: formattedRoles,
      pagination: {
        total,
        page,
      },
      empty: isTableEmpty,
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

// POST: Add a new role
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const clientIp = getClientIP(request);
    const body = await request.json();

    const parsedData = RoleSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 }, // Bad Request
      );
    }

    const { name, slug, description, permissions }: RoleSchemaType =
      parsedData.data;

    // Check for uniqueness
    const isUniqueRole = await isUnique('userRole', { slug, name });
    if (!isUniqueRole) {
      return NextResponse.json(
        { message: 'Name and slug must be unique' },
        { status: 400 },
      );
    }

    // Use a Prisma transaction to ensure all operations succeed or fail together
    const createdRole = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create the new role
        const newRole = await tx.userRole.create({
          data: {
            name,
            slug,
            description,
          },
        });

        // Add permissions to UserRolePermission table
        if (permissions && permissions.length > 0) {
          const rolePermissionEntries = permissions.map(
            (permissionId: string) => ({
              roleId: newRole.id,
              permissionId,
            }),
          );

          await tx.userRolePermission.createMany({
            data: rolePermissionEntries,
          });
        }

        // Log the event
        await systemLog(
          {
            event: 'create',
            userId: auth.session.user.id,
            entityId: newRole.id,
            entityType: 'user.role',
            description: 'User role added.',
            ipAddress: clientIp,
          },
          tx,
        );

        // Fetch the newly created role with its permissions
        return await tx.userRole.findUnique({
          where: { id: newRole.id },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });
      },
    );

    return NextResponse.json(createdRole, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
