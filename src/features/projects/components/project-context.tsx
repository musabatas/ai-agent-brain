'use client';

import { createContext, ReactNode, useContext } from 'react';
import { Project } from '@/models/project';

interface ProjectSummary {
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  counts: {
    features: Record<string, number>;
    tasks: Record<string, number>;
    decisions: number;
    activeRules: number;
    memory: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    summary?: string | null;
    createdAt: string;
  }>;
}

interface ProjectContextProps {
  project: Project;
  summary: ProjectSummary | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
}

interface ProjectProviderProps extends ProjectContextProps {
  children: ReactNode;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(
  undefined,
);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export type { ProjectSummary };

export const ProjectProvider = ({
  project,
  summary,
  isLoading,
  isSummaryLoading,
  children,
}: ProjectProviderProps) => {
  return (
    <ProjectContext.Provider
      value={{ project, summary, isLoading, isSummaryLoading }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
