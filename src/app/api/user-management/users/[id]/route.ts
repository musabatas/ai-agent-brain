import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/lib/services/system-log';
import {
  UserProfileSchema,
  UserProfileSchemaType,
} from '@/app/(protected)/user-management/users/[id]/forms/user-profile-schema';
import { UserStatus } from '@/models/user';

// GET: Fetch a specific user by ID, including role
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    // Fetch the user and their associated roles
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Edit a specific permission by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    // Ensure the user ID is provided
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid input.' },
        { status: 400 }, // Bad request
      );
    }

    const clientIp = getClientIP(request);
    const body = await request.json();

    const parsedData = UserProfileSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input.' },
        { status: 400 }, // Bad Request
      );
    }

    const { name, status, roleId }: UserProfileSchemaType = parsedData.data;

    // Check if the role exists
    const roleExists = await prisma.userRole.findUnique({
      where: { id: roleId },
    });
    if (!roleExists) {
      return NextResponse.json(
        { message: 'Role does not exist' },
        { status: 400 },
      );
    }

    // Use a transaction to insert multiple records atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.update({
        where: { id },
        data: { name, status: status as UserStatus, roleId },
      });

      // Log the event
      await systemLog(
        {
          event: 'update',
          userId: auth.session.user.id,
          entityId: user.id,
          entityType: 'user.profile',
          description: 'User profile updated.',
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    return NextResponse.json(
      { message: 'User profile successfully updated.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const clientIp = getClientIP(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid input.' },
        { status: 400 }, // Bad request
      );
    }

    // Check if the role exists
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (userToDelete && userToDelete.isProtected) {
      return NextResponse.json(
        { message: 'You do not have permission to delete system users.' },
        { status: 401 },
      );
    }

    // Use a transaction to insert multiple records atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await prisma.user.update({
        where: { id, isProtected: false },
        data: { isTrashed: true, status: UserStatus.INACTIVE },
      });

      // Log the event
      await systemLog(
        {
          event: 'trash',
          userId: auth.session.user.id,
          entityId: user.id,
          entityType: 'user',
          description: 'User trashed.',
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    return NextResponse.json(
      { message: 'User successfully deleted.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
