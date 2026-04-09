import { User } from './user';

// Enums
export const OrgMemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type OrgMemberRole =
  (typeof OrgMemberRole)[keyof typeof OrgMemberRole];

// Models
export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: OrgMember[];
  apiKeys?: ApiKey[];
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgMemberRole;
  joinedAt: Date;
  org?: Organization;
  user?: User;
}

export interface ApiKey {
  id: string;
  orgId: string;
  createdById: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  org?: Organization;
}
