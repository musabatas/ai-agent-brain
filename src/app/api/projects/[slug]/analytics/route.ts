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

    const [
      featureCounts,
      taskCounts,
      taskPriorityCounts,
      decisionCounts,
      recentActivity,
      recentTasks,
    ] = await Promise.all([
      prisma.feature.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId: project.id },
        _count: true,
      }),
      prisma.decision.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true,
      }),
      // Activity per day (last 14 days)
      prisma.activity.groupBy({
        by: ['action'],
        where: {
          projectId: project.id,
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
      // Recently completed tasks (last 30 days)
      prisma.task.findMany({
        where: {
          projectId: project.id,
          status: 'DONE',
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { completedAt: true },
        orderBy: { completedAt: 'asc' },
      }),
    ]);

    // Build weekly completion data for the chart
    const weeklyCompletions = buildWeeklyData(recentTasks.map(t => t.completedAt).filter(Boolean) as Date[]);

    return NextResponse.json({
      data: {
        features: Object.fromEntries(featureCounts.map(f => [f.status, f._count])),
        tasks: Object.fromEntries(taskCounts.map(t => [t.status, t._count])),
        taskPriorities: Object.fromEntries(taskPriorityCounts.map(p => [p.priority, p._count])),
        decisions: Object.fromEntries(decisionCounts.map(d => [d.status, d._count])),
        activityByAction: Object.fromEntries(recentActivity.map(a => [a.action, a._count])),
        weeklyCompletions,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function buildWeeklyData(completedDates: Date[]) {
  const weeks: { week: string; count: number }[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7 + 6));
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);

    const count = completedDates.filter(d => d >= weekStart && d < weekEnd).length;
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeks.push({ week: label, count });
  }

  return weeks;
}
