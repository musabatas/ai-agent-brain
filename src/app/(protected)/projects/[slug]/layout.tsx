'use client';

import React, { use, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Plug,
  RefreshCw,
  Scale,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectProvider } from '@/features/projects/components/project-context';

import type { LucideIcon } from 'lucide-react';

interface NavRoute {
  title: string;
  icon: LucideIcon;
  path: string;
}

const statusConfig: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: 'Active', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Paused', dot: 'bg-amber-500' },
  ARCHIVED: { label: 'Archived', dot: 'bg-zinc-400' },
};

export default function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const navRoutes = useMemo<NavRoute[]>(
    () => [
      { title: 'Overview', icon: LayoutDashboard, path: `/projects/${slug}` },
      { title: 'Features', icon: CheckSquare, path: `/projects/${slug}/features` },
      { title: 'Tasks', icon: BookOpen, path: `/projects/${slug}/tasks` },
      { title: 'Decisions', icon: Scale, path: `/projects/${slug}/decisions` },
      { title: 'Rules', icon: Shield, path: `/projects/${slug}/rules` },
      { title: 'Documents', icon: FileText, path: `/projects/${slug}/documents` },
      { title: 'Memory', icon: Brain, path: `/projects/${slug}/memory` },
      { title: 'MCP', icon: Plug, path: `/projects/${slug}/mcp-config` },
    ],
    [slug],
  );

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const response = await apiFetch(`/api/projects/${slug}`);
      if (response.status === 404) router.push('/projects');
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return (await response.json()).data;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['project-summary', slug],
    queryFn: async () => {
      const response = await apiFetch(`/api/projects/${slug}/context/summary`);
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return (await response.json()).data;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && (key.startsWith('project') || key === 'project-summary');
      },
    });
    setRefreshing(false);
  };

  const status = project?.status ? statusConfig[project.status] || statusConfig.ACTIVE : null;

  return (
    <ProjectProvider
      project={project}
      summary={summary}
      isLoading={isLoading}
      isSummaryLoading={isSummaryLoading}
    >
      <div className="flex min-h-[calc(100vh-48px)]">
        {/* ── Project Sidebar ── */}
        <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-border bg-surface-1/50 py-4">
          {/* Back link */}
          <div className="px-4 mb-4">
            <Link
              href="/projects"
              className={cn(
                'inline-flex items-center gap-2',
                'text-sm font-medium text-muted-foreground',
                'hover:text-foreground transition-colors',
                'group',
              )}
            >
              <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Projects</span>
            </Link>
          </div>

          {/* Project info */}
          <div className="px-4 mb-5">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-32 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-foreground truncate leading-tight">
                  {project?.name || 'Project'}
                </h2>
                {status && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`size-1.5 rounded-full ${status.dot}`} />
                    <span className="text-xs text-muted-foreground">{status.label}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Separator */}
          <div className="h-px bg-border mx-4 mb-3" />

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-0.5">
            {navRoutes.map(({ title, icon: Icon, path }) => {
              const isActive = path === `/projects/${slug}`
                ? pathname === path
                : pathname.startsWith(path);

              return (
                <Link
                  key={path}
                  href={path}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md',
                    'text-sm font-medium',
                    'transition-colors duration-150 ease-out',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom: Refresh */}
          <div className="px-3 pt-3 mt-auto border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="w-full justify-start text-muted-foreground text-sm h-8"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              <span>Refresh data</span>
            </Button>
          </div>
        </aside>

        {/* ── Mobile: Horizontal nav ── */}
        <div className="md:hidden border-b border-border bg-surface-1/50 px-4 py-2 overflow-x-auto scrollbar-none fixed top-12 left-0 right-0 z-10">
          <nav className="flex items-center gap-1">
            {navRoutes.map(({ title, icon: Icon, path }) => {
              const isActive = path === `/projects/${slug}`
                ? pathname === path
                : pathname.startsWith(path);

              return (
                <Link
                  key={path}
                  href={path}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md',
                    'text-[12px] font-medium whitespace-nowrap',
                    'transition-colors duration-150',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-3" />
                  <span>{title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0 px-4 py-5 lg:px-6 md:pt-0 pt-14">
          {/* Mobile: Project title */}
          <div className="md:hidden mb-4">
            <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1">
              <ArrowLeft className="size-3" />
              Projects
            </Link>
            {!isLoading && (
              <h2 className="text-lg font-semibold text-foreground truncate">
                {project?.name || 'Project'}
              </h2>
            )}
          </div>

          {children}
        </div>
      </div>
    </ProjectProvider>
  );
}
