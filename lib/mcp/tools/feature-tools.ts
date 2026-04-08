import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { featureService } from '@/lib/services/feature.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerFeatureTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug or ID (optional if X-Project-Slug header is set)');

  server.tool(
    'feature.list',
    'List features for a project, filterable by status and priority',
    {
      project: p,
      status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await featureService.list(auth.orgId, slug, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'feature.get',
    'Get a feature by ID with its tasks',
    {
      project: p,
      id: z.string().describe('Feature ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await featureService.get(auth.orgId, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Feature not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'feature.create',
    'Create a new feature in a project',
    {
      project: p,
      title: z.string().describe('Feature title'),
      description: z.string().optional().describe('Feature description'),
      plan: z.string().optional().describe('Implementation plan (markdown). Describes HOW to build this feature — approach, architecture, steps.'),
      status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      sortOrder: z.number().int().optional().describe('Display/execution order within status column (lower = first)'),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await featureService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'feature.update',
    'Update a feature',
    {
      project: p,
      id: z.string().describe('Feature ID'),
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      plan: z.string().nullable().optional().describe('Implementation plan (markdown). Set to null to clear.'),
      status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      sortOrder: z.number().int().optional().describe('Display order within status column (lower = first)'),
    },
    async ({ project, id, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await featureService.update(auth, slug, id, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Feature not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
