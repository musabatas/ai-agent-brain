import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { handleApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const permissions = await prisma.userPermission.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(permissions);
  } catch (error) {
    return handleApiError(error);
  }
}
