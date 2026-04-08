import { Organization } from './org';

// Enums
export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProjectStatus =
  (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const FeatureStatus = {
  BACKLOG: 'BACKLOG',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type FeatureStatus =
  (typeof FeatureStatus)[keyof typeof FeatureStatus];

export const Priority = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const DecisionStatus = {
  PROPOSED: 'PROPOSED',
  ACCEPTED: 'ACCEPTED',
  DEPRECATED: 'DEPRECATED',
  SUPERSEDED: 'SUPERSEDED',
} as const;
export type DecisionStatus =
  (typeof DecisionStatus)[keyof typeof DecisionStatus];

export const RuleScope = {
  GLOBAL: 'GLOBAL',
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND',
  DATABASE: 'DATABASE',
  API: 'API',
  TESTING: 'TESTING',
  DEVOPS: 'DEVOPS',
} as const;
export type RuleScope = (typeof RuleScope)[keyof typeof RuleScope];

export const RuleEnforcement = {
  MUST: 'MUST',
  SHOULD: 'SHOULD',
  MAY: 'MAY',
} as const;
export type RuleEnforcement =
  (typeof RuleEnforcement)[keyof typeof RuleEnforcement];

export const DocumentType = {
  NOTE: 'NOTE',
  SPEC: 'SPEC',
  GUIDE: 'GUIDE',
  RUNBOOK: 'RUNBOOK',
  REFERENCE: 'REFERENCE',
} as const;
export type DocumentType =
  (typeof DocumentType)[keyof typeof DocumentType];

export const MemoryType = {
  USER: 'USER',
  FEEDBACK: 'FEEDBACK',
  PROJECT: 'PROJECT',
  REFERENCE: 'REFERENCE',
} as const;
export type MemoryType = (typeof MemoryType)[keyof typeof MemoryType];

// Models
export interface Project {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  org?: Organization;
  features?: Feature[];
  tasks?: Task[];
  decisions?: Decision[];
  rules?: Rule[];
  documents?: Document[];
  memories?: Memory[];
}

export interface Feature {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: FeatureStatus;
  priority: Priority;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  featureId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  sortOrder: number;
  dependsOn: string[];
  tags: string[];
  metadata?: Record<string, unknown> | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  feature?: Feature | null;
}

export interface Decision {
  id: string;
  projectId: string;
  title: string;
  status: DecisionStatus;
  context: string;
  decision: string;
  alternatives?: Record<string, unknown>[] | null;
  consequences?: string | null;
  supersededById?: string | null;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface Rule {
  id: string;
  projectId: string;
  title: string;
  content: string;
  scope: RuleScope;
  enforcement: RuleEnforcement;
  isActive: boolean;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: DocumentType;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface Memory {
  id: string;
  projectId: string;
  key: string;
  value: string;
  type: MemoryType;
  tags: string[];
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface Activity {
  id: string;
  projectId: string;
  actorType: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  project?: Project;
}
