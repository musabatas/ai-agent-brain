'use client';

import {
  BookOpen,
  Brain,
  CheckSquare,
  Clock,
  Scale,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useProject } from '@/features/projects/components/project-context';
import { AnalyticsCharts } from '@/features/projects/components/analytics-charts';

import type { LucideIcon } from 'lucide-react';

const statusDotColors: Record<string, string> = {
  DRAFT: 'bg-zinc-400',
  PLANNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  IN_REVIEW: 'bg-violet-500',
  DONE: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
  BLOCKED: 'bg-red-500',
  TODO: 'bg-zinc-400',
  BACKLOG: 'bg-zinc-300',
};

const entityBadgeColors: Record<string, string> = {
  FEATURE: 'text-foreground bg-foreground/5',
  TASK: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  DECISION: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
  RULE: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  MEMORY: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  DOCUMENT: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
};

function formatTimeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-0.5 h-3.5 rounded-full bg-foreground/20" />
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {children}
      </h3>
    </div>
  );
}

export default function Page() {
  const { summary, isSummaryLoading, project } = useProject();

  if (isSummaryLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="size-8 rounded-md mb-3" />
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <Skeleton className="size-1.5 rounded-full mt-2 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { counts, recentActivity } = summary;

  const totalFeatures = Object.values(counts.features).reduce(
    (sum: number, v: number) => sum + v, 0,
  );
  const totalTasks = Object.values(counts.tasks).reduce(
    (sum: number, v: number) => sum + v, 0,
  );

  const statCards: { icon: LucideIcon; label: string; value: number }[] = [
    { icon: CheckSquare, label: 'Features', value: totalFeatures },
    { icon: BookOpen, label: 'Tasks', value: totalTasks },
    { icon: Scale, label: 'Decisions', value: counts.decisions },
    { icon: Shield, label: 'Rules', value: counts.activeRules },
    { icon: Brain, label: 'Memory', value: counts.memory },
  ];

  const limitedActivity = recentActivity.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-center size-8 rounded-md bg-muted mb-3">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="font-mono text-2xl font-semibold text-foreground leading-none">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Status Breakdown ── */}
      {(Object.keys(counts.features).length > 0 ||
        Object.keys(counts.tasks).length > 0) && (
        <div className="rounded-lg border bg-card p-5">
          <SectionLabel>Status Breakdown</SectionLabel>
          <div className="space-y-3">
            {Object.keys(counts.features).length > 0 && (
              <StatusRow label="Features" data={counts.features} />
            )}
            {Object.keys(counts.tasks).length > 0 && (
              <StatusRow label="Tasks" data={counts.tasks} />
            )}
          </div>
        </div>
      )}

      {/* ── Analytics ── */}
      {project?.slug && <AnalyticsCharts slug={project.slug} />}

      {/* ── Recent Activity ── */}
      <div className="rounded-lg border bg-card p-5">
        <SectionLabel>Recent Activity</SectionLabel>
        {limitedActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="size-5 mb-2 opacity-30" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {limitedActivity.map(
              (activity: {
                id: string;
                summary?: string | null;
                action: string;
                entityType: string;
                createdAt: string;
              }) => (
                <div
                  key={activity.id}
                  className="group flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  {/* Dot */}
                  <div className="mt-1.5 shrink-0">
                    <span className="block size-1.5 rounded-full bg-foreground/20 group-first:bg-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {activity.summary || `${activity.action} ${activity.entityType}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          entityBadgeColors[activity.entityType] || 'text-muted-foreground bg-muted',
                        )}
                      >
                        {activity.entityType}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status Row ── */
function StatusRow({ label, data }: { label: string; data: Record<string, number> }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(data).map(([status, count]: [string, number]) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', statusDotColors[status] || 'bg-zinc-400')} />
            <span>{status.replace('_', ' ')}</span>
            <span className="font-mono text-foreground">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
