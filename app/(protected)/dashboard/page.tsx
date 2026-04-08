'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  FolderKanban,
  Gavel,
  ListTodo,
  Plus,
  ScrollText,
} from 'lucide-react';
import { Container } from '@/components/common/container';
import { Badge, BadgeDot } from '@/components/ui/badge';
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

const statusConfig: Record<string, { dot: string; text: string }> = {
  ACTIVE: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  PAUSED: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  ARCHIVED: { dot: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user has any orgs — returns Org[] (same shape as org-switcher)
  const { data: orgs = [], isLoading: orgsLoading, isSuccess: orgsSuccess } = useQuery<Org[]>({
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

  // Redirect to onboarding only when query succeeded and truly returned zero orgs
  const shouldRedirect = orgsSuccess && orgs.length === 0;

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/onboarding');
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return null;
  }

  const totalTasks = projects.reduce((sum, p) => sum + p._count.tasks, 0);
  const totalDecisions = projects.reduce(
    (sum, p) => sum + p._count.decisions,
    0,
  );
  const totalRules = projects.reduce((sum, p) => sum + p._count.rules, 0);

  return (
    <div className="adb-dotgrid min-h-full">
      <Container>
        {/* Hero Section */}
        <div className="adb-fade-in relative py-6 mb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Command Center
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back,{' '}
                <span className="text-foreground font-medium">{userName}</span>
                . Your project intelligence at a glance.
              </p>
            </div>
            <Button
              className="shrink-0"
              onClick={() => router.push('/projects')}
            >
              <Plus className="size-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="adb-stagger grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<FolderKanban className="size-5 text-primary" />}
            label="Projects"
            value={isLoading ? '-' : String(projects.length)}
            borderColor="border-l-primary"
          />
          <StatCard
            icon={<ListTodo className="size-5 text-emerald-500" />}
            label="Total Tasks"
            value={isLoading ? '-' : String(totalTasks)}
            borderColor="border-l-emerald-500"
          />
          <StatCard
            icon={<Gavel className="size-5 text-violet-500" />}
            label="Decisions"
            value={isLoading ? '-' : String(totalDecisions)}
            borderColor="border-l-violet-500"
          />
          <StatCard
            icon={<ScrollText className="size-5 text-amber-500" />}
            label="Active Rules"
            value={isLoading ? '-' : String(totalRules)}
            borderColor="border-l-amber-500"
          />
        </div>

        {/* Projects Section */}
        <div className="adb-fade-in mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Projects
          </h2>
        </div>

        {isLoading ? (
          <div className="adb-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="adb-project-card rounded-xl p-5 space-y-3"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-1 w-full rounded-full mt-4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="adb-fade-in relative rounded-xl border border-border adb-dotgrid p-16 text-center">
            <div className="adb-glow inline-flex rounded-2xl bg-muted/50 p-5 mb-5">
              <Brain className="size-10 text-muted-foreground adb-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first project to start building your AI development
              brain.
            </p>
            <Button onClick={() => router.push('/projects')}>
              <Plus className="size-4 mr-1.5" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="adb-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {projects.map((project) => {
              const total =
                project._count.features +
                project._count.tasks +
                project._count.decisions +
                project._count.rules;
              const status = statusConfig[project.status] ??
                statusConfig.ACTIVE;

              return (
                <div
                  key={project.id}
                  className="adb-project-card rounded-xl cursor-pointer flex flex-col"
                  onClick={() => router.push(`/projects/${project.slug}`)}
                >
                  <div className="p-5 pb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                      {project.name}
                    </h3>
                    <Badge
                      variant="outline"
                      appearance="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <BadgeDot className={status.dot} />
                      <span className={status.text}>
                        {project.status.toLowerCase()}
                      </span>
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="px-5 text-xs text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="px-5 mt-auto flex items-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="size-3.5 text-primary/70" />
                      <span className="adb-mono">
                        {project._count.features}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="size-3.5 text-emerald-500/70" />
                      <span className="adb-mono">{project._count.tasks}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Gavel className="size-3.5 text-violet-500/70" />
                      <span className="adb-mono">
                        {project._count.decisions}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ScrollText className="size-3.5 text-amber-500/70" />
                      <span className="adb-mono">{project._count.rules}</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 mx-5 mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        Items
                      </span>
                      <span className="adb-mono text-[10px] text-muted-foreground">
                        {project._count.tasks}/{total}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{
                          width:
                            total > 0
                              ? `${(project._count.tasks / total) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <div
      className={`adb-stat-card rounded-xl border-l-[3px] ${borderColor} p-4 flex items-center gap-4`}
    >
      <div className="rounded-lg bg-muted/60 p-2.5">{icon}</div>
      <div>
        <p className="adb-mono text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
