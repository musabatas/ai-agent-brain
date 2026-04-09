'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#a1a1aa',
  TODO: '#a1a1aa',
  IN_PROGRESS: '#f59e0b',
  REVIEW: '#8b5cf6',
  DONE: '#10b981',
  BLOCKED: '#ef4444',
  CANCELLED: '#6b7280',
  PROPOSED: '#3b82f6',
  ACCEPTED: '#10b981',
  DEPRECATED: '#f59e0b',
  SUPERSEDED: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#3b82f6',
  P3: '#a1a1aa',
};

interface AnalyticsData {
  features: Record<string, number>;
  tasks: Record<string, number>;
  taskPriorities: Record<string, number>;
  decisions: Record<string, number>;
  weeklyCompletions: { week: string; count: number }[];
}

export function AnalyticsCharts({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery<{ data: AnalyticsData }>({
    queryKey: ['project-analytics', slug],
    queryFn: async () => {
      const res = await apiFetch(`/api/projects/${slug}/analytics`);
      if (!res.ok) throw new Error('Failed to load analytics');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[160px] w-full" />
        </div>
        <div className="rounded-xl border border-border p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[160px] w-full" />
        </div>
      </div>
    );
  }

  if (!data?.data) return null;

  const { features, tasks, taskPriorities, weeklyCompletions } = data.data;

  const taskStatusData = Object.entries(tasks).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    fill: STATUS_COLORS[status] || '#a1a1aa',
  }));

  const featureStatusData = Object.entries(features).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    fill: STATUS_COLORS[status] || '#a1a1aa',
  }));

  const priorityData = Object.entries(taskPriorities).map(([priority, count]) => ({
    name: priority,
    value: count,
    fill: PRIORITY_COLORS[priority] || '#a1a1aa',
  }));

  const hasData = taskStatusData.length > 0 || featureStatusData.length > 0;
  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 adb-stagger">
      {/* Task Velocity Chart */}
      {weeklyCompletions.length > 0 && (
        <div className="rounded-xl border border-border p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Task Velocity
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyCompletions} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature Status Distribution */}
      {featureStatusData.length > 0 && (
        <div className="rounded-xl border border-border p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Feature Status
          </h4>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={featureStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {featureStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {featureStatusData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="adb-mono text-foreground font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Priority Breakdown */}
      {priorityData.length > 0 && (
        <div className="rounded-xl border border-border p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Task Priorities
          </h4>
          <div className="space-y-2.5">
            {priorityData.map(d => {
              const total = priorityData.reduce((s, p) => s + p.value, 0);
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-6 adb-mono" style={{ color: d.fill }}>{d.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: d.fill }} />
                  </div>
                  <span className="text-xs adb-mono text-muted-foreground w-6 text-right">{d.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Status Distribution */}
      {taskStatusData.length > 0 && (
        <div className="rounded-xl border border-border p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Task Status
          </h4>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {taskStatusData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="adb-mono text-foreground font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
