'use client';

import {
  BookOpen,
  Brain,
  CheckSquare,
  Clock,
  Scale,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProject } from './components/project-context';
import { AnalyticsCharts } from './components/analytics-charts';

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
  FEATURE: 'text-primary bg-primary/10',
  TASK: 'text-emerald-400 bg-emerald-500/10',
  DECISION: 'text-violet-400 bg-violet-500/10',
  RULE: 'text-amber-400 bg-amber-500/10',
  MEMORY: 'text-cyan-400 bg-cyan-500/10',
  DOCUMENT: 'text-blue-400 bg-blue-500/10',
};

export default function Page() {
  const { summary, isSummaryLoading, project } = useProject();

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 adb-stagger">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="adb-stat-card rounded-lg p-4">
            <Skeleton className="size-8 rounded-md mb-3" />
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="size-2 rounded-full mt-1.5 shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isSummaryLoading || !summary) {
    return <LoadingSkeleton />;
  }

  const { counts, recentActivity } = summary;

  const totalFeatures = Object.values(counts.features).reduce(
    (sum: number, v: number) => sum + v,
    0,
  );
  const totalTasks = Object.values(counts.tasks).reduce(
    (sum: number, v: number) => sum + v,
    0,
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const statCards = [
    {
      icon: CheckSquare,
      label: 'Features',
      value: totalFeatures,
      iconClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      icon: BookOpen,
      label: 'Tasks',
      value: totalTasks,
      iconClass: 'text-emerald-500',
      bgClass: 'bg-emerald-500/10',
    },
    {
      icon: Scale,
      label: 'Decisions',
      value: counts.decisions,
      iconClass: 'text-violet-500',
      bgClass: 'bg-violet-500/10',
    },
    {
      icon: Shield,
      label: 'Active Rules',
      value: counts.activeRules,
      iconClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10',
    },
    {
      icon: Brain,
      label: 'Memory',
      value: counts.memory,
      iconClass: 'text-cyan-500',
      bgClass: 'bg-cyan-500/10',
    },
  ];

  const limitedActivity = recentActivity.slice(0, 8);

  return (
    <div className="space-y-6 adb-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 adb-stagger">
        {statCards.map(({ icon: Icon, label, value, iconClass, bgClass }) => (
          <div key={label} className="adb-stat-card rounded-lg p-4">
            <div
              className={`flex items-center justify-center size-8 rounded-md ${bgClass} mb-3`}
            >
              <Icon className={`size-4 ${iconClass}`} />
            </div>
            <p className="adb-mono text-2xl font-semibold text-foreground">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdowns — compact inline rows */}
      {(Object.keys(counts.features).length > 0 ||
        Object.keys(counts.tasks).length > 0) && (
        <div className="space-y-3">
          {Object.keys(counts.features).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                Features
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(counts.features).map(
                  ([status, count]: [string, number]) => (
                    <span
                      key={status}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className={`size-1.5 rounded-full ${statusDotColors[status] || 'bg-zinc-400'}`}
                      />
                      <span>{status.replace('_', ' ')}</span>
                      <span className="adb-mono text-foreground">{count}</span>
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {Object.keys(counts.tasks).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                Tasks
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(counts.tasks).map(
                  ([status, count]: [string, number]) => (
                    <span
                      key={status}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className={`size-1.5 rounded-full ${statusDotColors[status] || 'bg-zinc-400'}`}
                      />
                      <span>{status.replace('_', ' ')}</span>
                      <span className="adb-mono text-foreground">{count}</span>
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts */}
      <AnalyticsCharts slug={project.slug} />

      {/* Recent Activity — Timeline */}
      <div className="pt-2">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Recent Activity
        </h3>
        {limitedActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">
            No activity recorded yet.
          </p>
        ) : (
          <div className="adb-neural-line pl-5 space-y-0">
            {limitedActivity.map(
              (
                activity: {
                  id: string;
                  summary?: string | null;
                  action: string;
                  entityType: string;
                  createdAt: string;
                },
                index: number,
              ) => (
                <div key={activity.id} className="relative pb-5 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-1 flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {activity.summary ||
                          `${activity.action} ${activity.entityType}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="adb-mono text-[11px] text-muted-foreground">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                            entityBadgeColors[activity.entityType] ||
                            'text-muted-foreground bg-muted'
                          }`}
                        >
                          {activity.entityType}
                        </span>
                      </div>
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
