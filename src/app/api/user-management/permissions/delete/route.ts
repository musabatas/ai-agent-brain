import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const clientIp = getClientIP(request);
    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json({ message: 'Invalid input.' }, { status: 400 });
    }

    // Validation: Limit deletion to a maximum of 2 records to ensure a smooth demo experience for users.
    if (permissionIds.length > 2) {
      return NextResponse.json(
        {
          message: 'You cannot delete more than 2 records at once.',
        },
        { status: 400 },
      );
    }

    // Perform deletion in a transaction to ensure atomicity
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete linked role permissions
      await tx.userRolePermission.deleteMany({
        where: {
          permissionId: { in: permissionIds },
        },
      });

      // Delete the permissions themselves
      await tx.userPermission.deleteMany({
        where: {
          id: { in: permissionIds },
        },
      });

      // Log the event
      await systemLog(
        {
          event: 'create',
          userId: auth.session.user.id,
          entityId: permissionIds.join(', '),
          entityType: 'user.permissions',
          description: 'User permissions deleted.',
          ipAddress: clientIp,
        },
        tx,
      );
    });

    return NextResponse.json({
      message: 'Delete selected success',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
