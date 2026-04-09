'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Brain,
  CheckSquare,
  FolderKanban,
  Gavel,
  Plus,
  ScrollText,
} from 'lucide-react';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';

interface Org {
  id: string;
  name: string;
  slug: string;
  memberRole: string;
  memberCount: number;
  projectCount: number;
}

interface ProjectWithCounts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    features: number;
    tasks: number;
    decisions: number;
    rules: number;
  };
}

const statusConfig: Record<string, { dot: string; label: string }> = {
  ACTIVE: { dot: 'bg-emerald-500', label: 'Active' },
  PAUSED: { dot: 'bg-amber-500', label: 'Paused' },
  ARCHIVED: { dot: 'bg-zinc-400', label: 'Archived' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const {
    data: orgs = [],
    isSuccess: orgsSuccess,
  } = useQuery<Org[]>({
    queryKey: ['user-orgs'],
    queryFn: async () => {
      const res = await apiFetch('/api/orgs');
      if (!res.ok) throw new Error('Failed to load organizations');
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: async () => {
      const res = await apiFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: orgs.length > 0,
  });

  const projects: ProjectWithCounts[] = projectsData?.data ?? [];
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  const shouldRedirect = orgsSuccess && orgs.length === 0;

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/onboarding');
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) return null;

  const totalFeatures = projects.reduce((s, p) => s + p._count.features, 0);
  const totalTasks = projects.reduce((s, p) => s + p._count.tasks, 0);
  const totalRules = projects.reduce((s, p) => s + p._count.rules, 0);

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderKanban },
    { label: 'Features', value: totalFeatures, icon: CheckSquare },
    { label: 'Tasks', value: totalTasks, icon: Gavel },
    { label: 'Rules', value: totalRules, icon: ScrollText },
  ];

  return (
    <Container>
      {/* Hero */}
      <div className="py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your project intelligence at a glance.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => router.push('/projects')}
          >
            <Plus className="size-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-center size-9 rounded-md bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tracking-tight text-foreground leading-none">
                {isLoading ? '–' : value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-0.5 h-4 rounded-full bg-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Projects
        </h2>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-16 text-center">
          <Brain className="size-8 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No projects yet
          </h3>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
            Create your first project to start building your AI development
            brain.
          </p>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => router.push('/projects')}
          >
            <Plus className="size-3.5" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
          {projects.map((project) => {
            const status = statusConfig[project.status] ?? statusConfig.ACTIVE;

            return (
              <div
                key={project.id}
                className="group rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/projects/${project.slug}`)}
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`size-1.5 rounded-full ${status.dot}`} />
                      <span className="text-xs text-muted-foreground">
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="size-3" />
                      <span className="font-mono">{project._count.features}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Gavel className="size-3" />
                      <span className="font-mono">{project._count.tasks}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ScrollText className="size-3" />
                      <span className="font-mono">{project._count.decisions}</span>
                    </span>
                    <ArrowRight className="size-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
