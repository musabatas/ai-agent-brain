import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const activities = await prisma.activity.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ data: activities });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
