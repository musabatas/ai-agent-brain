import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { decisionService } from '@/features/projects/services/decision.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerDecisionTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'decision.list',
    'List decisions for a project, filterable by status and tags',
    {
      project: p,
      status: z.enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED']).optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.list(auth.orgId, slug, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'decision.get',
    'Get a decision record by ID',
    {
      project: p,
      id: z.string().describe('Decision ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.get(auth.orgId, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Decision not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'decision.create',
    'Record a new architectural decision',
    {
      project: p,
      title: z.string().describe('Decision title'),
      context: z.string().describe('Why this decision was needed'),
      decision: z.string().describe('What was decided'),
      status: z.enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED']).optional(),
      alternatives: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      })).optional().describe('Alternatives considered'),
      consequences: z.string().optional().describe('What follows from this decision'),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'decision.update',
    'Update a decision',
    {
      project: p,
      id: z.string().describe('Decision ID'),
      title: z.string().optional(),
      status: z.enum(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED']).optional(),
      context: z.string().optional(),
      decision: z.string().optional(),
      consequences: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, id, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.update(auth, slug, id, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Decision not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'decision.supersede',
    'Mark a decision as superseded by another decision',
    {
      project: p,
      id: z.string().describe('Decision ID to supersede'),
      newDecisionId: z.string().describe('ID of the replacement decision'),
    },
    async ({ project, id, newDecisionId }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.supersede(auth, slug, id, newDecisionId);
      if (!result) return { content: [{ type: 'text' as const, text: 'Decision not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'decision.search',
    'Full-text search across decisions in a project',
    {
      project: p,
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async ({ project, query, limit }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await decisionService.search(auth.orgId, slug, query, limit);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
