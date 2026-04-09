'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckSquare,
  Gavel,
  ScrollText,
} from 'lucide-react';
import { Project, ProjectStatus } from '@/models/project';

interface ProjectWithCounts extends Project {
  _count: {
    features: number;
    tasks: number;
    decisions: number;
    rules: number;
  };
}

const statusConfig: Record<
  ProjectStatus,
  { dot: string; label: string }
> = {
  ACTIVE: { dot: 'bg-emerald-500', label: 'Active' },
  PAUSED: { dot: 'bg-amber-500', label: 'Paused' },
  ARCHIVED: { dot: 'bg-zinc-400', label: 'Archived' },
};

const ProjectCard = ({ project }: { project: ProjectWithCounts }) => {
  const status = statusConfig[project.status] || statusConfig.ACTIVE;

  return (
    <Link href={`/projects/${project.slug}`}>
      <div className="group rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer h-full flex flex-col">
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
    </Link>
  );
};

export type { ProjectWithCounts };
export default ProjectCard;
