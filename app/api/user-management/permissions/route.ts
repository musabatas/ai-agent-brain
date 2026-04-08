import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api';
import { requireAdmin } from '@/lib/admin-guard';
import { handleApiError } from '@/lib/api-error';
import { isUnique } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  PermissionSchema,
  PermissionSchemaType,
} from '@/app/(protected)/user-management/permissions/forms/permission-schema';

// GET: Fetch all permissions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const query = searchParams.get('query') || '';
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const roleId = searchParams.get('roleId') || null;
  const skip = (page - 1) * limit;

  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    // Count total records matching the filter
    const total = await prisma.userPermission.count({
      where: {
        AND: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          ...(roleId ? [{ roles: { some: { roleId } } }] : []), // Filter by roleId if provided
        ],
      },
    });

    let isTableEmpty = false;

    if (total === 0) {
      // Check if the entire table is empty
      const overallTotal = await prisma.userPermission.count();
      isTableEmpty = overallTotal === 0;
    }

    // Get paginated records if total > 0
    const permissions =
      total > 0
        ? await prisma.userPermission.findMany({
            skip,
            take: limit,
            where: {
              AND: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                ...(roleId ? [{ roles: { some: { roleId } } }] : []), // Filter by roleId if provided
              ],
            },
            orderBy: {
              [sortField]: sortDirection,
            },
            include: {
              roles: true, // Optionally include related roles
            },
          })
        : [];

    return NextResponse.json({
      data: permissions,
      pagination: {
        total,
        page,
      },
      empty: isTableEmpty, // Use the fallback check
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Add a new permission
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const clientIp = getClientIP(request);
    const body = await request.json();

    const parsedData = PermissionSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 }, // Bad Request
      );
    }

    const { name, slug, description }: PermissionSchemaType = parsedData.data;

    // Ensure the permission name and slug are unique
    const isUniquePermission = await isUnique('userPermission', { slug, name });
    if (!isUniquePermission) {
      return NextResponse.json(
        { message: 'Name must be unique' },
        { status: 400 },
      );
    }

    const newPermission = await prisma.userPermission.create({
      data: { name, slug, description },
    });

    // Log the event
    await systemLog({
      event: 'create',
      userId: auth.session.user.id,
      entityId: newPermission.id,
      entityType: 'user.permission',
      description: 'User permission added.',
      ipAddress: clientIp,
    });

    return NextResponse.json(newPermission);
  } catch (error) {
    return handleApiError(error);
  }
}
