'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, Plus } from 'lucide-react';
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
import ProjectCard, { ProjectWithCounts } from '@/features/projects/components/project-card';
import ProjectCreateDialog from '@/features/projects/components/project-create-dialog';

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

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Projects</ToolbarTitle>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              size="sm"
              className="rounded-full"
              disabled={isLoading}
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              New Project
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
              Create your first project to start building your AI development brain.
            </p>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
