'use client';

import Link from 'next/link';
import {
  BookOpen,
  CheckSquare,
  FolderKanban,
  Gavel,
  ScrollText,
} from 'lucide-react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Project, ProjectStatus } from '@/app/models/project';

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
  { dot: string; text: string; label: string }
> = {
  ACTIVE: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'active',
  },
  PAUSED: {
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'paused',
  },
  ARCHIVED: {
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'archived',
  },
};

const ProjectCard = ({ project }: { project: ProjectWithCounts }) => {
  const status = statusConfig[project.status] || statusConfig.ACTIVE;
  const total =
    project._count.features +
    project._count.tasks +
    project._count.decisions +
    project._count.rules;

  return (
    <Link href={`/projects/${project.slug}`}>
      <div className="adb-project-card rounded-xl cursor-pointer h-full flex flex-col">
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {project.name}
          </h3>
          <Badge variant="outline" appearance="outline" size="sm" className="shrink-0">
            <BadgeDot className={status.dot} />
            <span className={status.text}>{status.label}</span>
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
            <span className="adb-mono">{project._count.features}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckSquare className="size-3.5 text-emerald-500/70" />
            <span className="adb-mono">{project._count.tasks}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Gavel className="size-3.5 text-violet-500/70" />
            <span className="adb-mono">{project._count.decisions}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ScrollText className="size-3.5 text-amber-500/70" />
            <span className="adb-mono">{project._count.rules}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 mx-5 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Items</span>
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
    </Link>
  );
};

export type { ProjectWithCounts };
export default ProjectCard;
