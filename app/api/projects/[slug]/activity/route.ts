import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { resolveProject } from '@/lib/services/_helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug } = await params;
    const project = await resolveProject(auth.orgId, slug);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where = { projectId: project.id };
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      data: activities,
      pagination: { total, limit, offset, hasMore: offset + activities.length < total },
    });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
