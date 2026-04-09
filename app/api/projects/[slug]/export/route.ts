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
    if (!auth) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

    const { slug } = await params;
    const project = await resolveProject(auth.orgId, slug);
    if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

    const [features, tasks, decisions, rules, documents, memory] = await Promise.all([
      prisma.feature.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: 'asc' } }),
      prisma.task.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: 'asc' } }),
      prisma.decision.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } }),
      prisma.rule.findMany({ where: { projectId: project.id }, orderBy: { scope: 'asc' } }),
      prisma.document.findMany({ where: { projectId: project.id }, orderBy: { updatedAt: 'desc' } }),
      prisma.memory.findMany({ where: { projectId: project.id }, orderBy: { updatedAt: 'desc' } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description,
        status: project.status,
      },
      features,
      tasks,
      decisions,
      rules,
      documents,
      memory,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${project.slug}-export.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
