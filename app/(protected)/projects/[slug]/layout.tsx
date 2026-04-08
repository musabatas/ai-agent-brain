'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Brain,
  CheckSquare,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Plug,
  RefreshCw,
  Scale,
  Shield,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/common/container';
import { ProjectProvider } from './components/project-context';

type NavRoutes = Record<
  string,
  {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    path: string;
  }
>;

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-500' },
  PAUSED: { label: 'Paused', color: 'bg-amber-500' },
  ARCHIVED: { label: 'Archived', color: 'bg-zinc-400' },
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
  const [activeTab, setActiveTab] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const navRoutes = useMemo<NavRoutes>(
    () => ({
      overview: {
        title: 'Overview',
        icon: LayoutDashboard,
        path: `/projects/${slug}`,
      },
      features: {
        title: 'Features',
        icon: CheckSquare,
        path: `/projects/${slug}/features`,
      },
      tasks: {
        title: 'Tasks',
        icon: BookOpen,
        path: `/projects/${slug}/tasks`,
      },
      decisions: {
        title: 'Decisions',
        icon: Scale,
        path: `/projects/${slug}/decisions`,
      },
      rules: {
        title: 'Rules',
        icon: Shield,
        path: `/projects/${slug}/rules`,
      },
      documents: {
        title: 'Documents',
        icon: FileText,
        path: `/projects/${slug}/documents`,
      },
      memory: {
        title: 'Memory',
        icon: Brain,
        path: `/projects/${slug}/memory`,
      },
      'mcp-config': {
        title: 'MCP Config',
        icon: Plug,
        path: `/projects/${slug}/mcp-config`,
      },
    }),
    [slug],
  );

  useEffect(() => {
    const found = Object.keys(navRoutes).find(
      (key) => pathname === navRoutes[key].path,
    );
    if (found) {
      setActiveTab(found);
    } else {
      setActiveTab('overview');
    }
  }, [navRoutes, pathname]);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const response = await apiFetch(`/api/projects/${slug}`);

      if (response.status === 404) {
        router.push('/projects');
      }

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      const json = await response.json();
      return json.data;
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

      const json = await response.json();
      return json.data;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const handleTabClick = (key: string, path: string) => {
    setActiveTab(key);
    router.push(path);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return (
          typeof key === 'string' &&
          (key.startsWith('project') || key === 'project-summary')
        );
      },
    });
    setRefreshing(false);
  };

  const status = project?.status
    ? statusConfig[project.status] || statusConfig.ACTIVE
    : null;

  return (
    <ProjectProvider
      project={project}
      summary={summary}
      isLoading={isLoading}
      isSummaryLoading={isSummaryLoading}
    >
      <Container>
        {/* Project Header */}
        <div className="pb-4 pt-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Link
                href="/projects"
                className="mt-1.5 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-7 w-52 mb-1.5" />
                ) : (
                  <h1 className="text-xl font-semibold text-foreground truncate">
                    {project?.name || 'Project'}
                  </h1>
                )}
                {!isLoading && project?.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-lg">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            {!isLoading && status && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 mt-1">
                <span className={`size-2 rounded-full ${status.color}`} />
                <span>{status.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border mb-5 -mx-1">
          <div className="flex items-center">
            <nav
              className="flex gap-0.5 overflow-x-auto scrollbar-none px-1 flex-1"
              role="tablist"
            >
              {Object.entries(navRoutes).map(
                ([key, { title, icon: Icon, path }]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={activeTab === key}
                    disabled={isLoading}
                    onClick={() => handleTabClick(key, path)}
                    data-active={activeTab === key ? 'true' : undefined}
                    className="adb-tab flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="size-3.5" />
                    <span>{title}</span>
                  </button>
                ),
              )}
            </nav>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mx-1 mb-0.5"
              title="Refresh project data"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {children}
      </Container>
    </ProjectProvider>
  );
}
