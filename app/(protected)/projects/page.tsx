'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, FolderOpen, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import ProjectCard, { ProjectWithCounts } from './components/project-card';
import ProjectCreateDialog from './components/project-create-dialog';

export default function Page() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiFetch('/api/projects');

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const projects: ProjectWithCounts[] = data?.data || [];

  const LoadingSkeleton = () => (
    <div className="adb-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="adb-project-card rounded-xl p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-1 w-full rounded-full mt-4" />
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
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
      <Button onClick={() => setCreateDialogOpen(true)}>
        <Plus className="size-4 mr-1.5" />
        Create Project
      </Button>
    </div>
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Projects</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              disabled={isLoading}
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus />
              New Project
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {isLoading ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="adb-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </Container>

      <ProjectCreateDialog
        open={createDialogOpen}
        closeDialog={() => setCreateDialogOpen(false)}
      />
    </>
  );
}
