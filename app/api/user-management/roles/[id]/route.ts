import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { handleApiError } from '@/lib/api-error';
import { isUnique } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  RoleSchema,
  RoleSchemaType,
} from '@/app/(protected)/user-management/roles/forms/role-schema';
import { UserRolePermission } from '@/app/models/user';

// GET: Fetch a specific role by ID, including permissions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const role = await prisma.userRole.findUnique({
      where: { id: (await params).id },
      include: {
        permissions: {
          include: {
            permission: true, // Fetch full permission details
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    // Map permissions to a flat structure
    const permissions = role.permissions.map(
      (p: UserRolePermission) => p.permission,
    );

    return NextResponse.json({ ...role, permissions });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Edit a specific role by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    // Await the params to resolve correctly
    const { params } = context;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    // Check if record exists
    const existingCategory = await prisma.userRole.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

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

    // Check uniqueness for name and slug
    const isUniqueRole = await isUnique('userRole', { slug, name }, { id });
    if (!isUniqueRole) {
      return NextResponse.json(
        { message: 'Name or slug must be unique' },
        { status: 400 },
      );
    }

    // Perform database operations in a transaction
    const updatedRole = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Update role details
        const role = await tx.userRole.update({
          where: { id },
          data: { name, slug, description },
        });

        // Remove existing permissions regardless of whether `permissions` is empty or not
        await tx.userRolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions if provided
        if (permissions && permissions?.length > 0) {
          const newPermissions = permissions.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          }));

          await tx.userRolePermission.createMany({ data: newPermissions });
        }

        return role;
      },
    );

    return NextResponse.json(updatedRole);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Remove a specific role by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const clientIp = getClientIP(request);
    const { id } = await params;

    // Check if id passed
    if (!id) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    // Check if record exists
    const existingCategory = await prisma.userRole.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    // Check if the role exists
    const role = await prisma.userRole.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    // Check if the role is protected
    if (role.isProtected) {
      return NextResponse.json(
        { message: 'Cannot delete a protected role' },
        { status: 403 },
      );
    }

    // Check if the role is assigned to any user
    const roleAssignedToUsers = await prisma.user.count({
      where: { roleId: id },
    });

    if (roleAssignedToUsers > 0) {
      return NextResponse.json(
        { message: 'Role is assigned to users and cannot be deleted' },
        { status: 403 },
      );
    }

    // Delete the role and its associated permissions in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete linked role permissions
      await tx.userRolePermission.deleteMany({
        where: { roleId: id },
      });

      // Delete the permission itself
      await tx.userRole.delete({
        where: { id },
      });

      // Log the event
      await systemLog(
        {
          event: 'delete',
          userId: auth.session.user.id,
          entityId: id,
          entityType: 'user.role',
          description: 'User role deleted.',
          ipAddress: clientIp,
        },
        tx,
      );
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
