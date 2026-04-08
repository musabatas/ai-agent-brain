import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';

export async function PATCH(
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

    // Use a transaction to insert multiple records atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await prisma.user.update({
        where: { id, isProtected: false },
        data: { isTrashed: false },
      });

      // Log the event
      await systemLog(
        {
          event: 'restore',
          userId: auth.session.user.id,
          entityId: user.id,
          entityType: 'user',
          description: 'User restored.',
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    return NextResponse.json(
      {
        message: 'User successfully restored.',
        user: result,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
