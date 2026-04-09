import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { ruleService } from '@/features/projects/services/rule.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerRuleTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'rule.list',
    'List rules for a project, filterable by scope and active status',
    {
      project: p,
      scope: z.enum(['GLOBAL', 'BACKEND', 'FRONTEND', 'DATABASE', 'API', 'TESTING', 'DEVOPS']).optional(),
      isActive: z.boolean().optional().describe('Filter by active status (default: active only)'),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.list(auth.orgId, slug, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'rule.get',
    'Get a rule by ID',
    {
      project: p,
      id: z.string().describe('Rule ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.get(auth.orgId, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Rule not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'rule.create',
    'Add a new rule or convention to a project',
    {
      project: p,
      title: z.string().describe('Rule title'),
      content: z.string().describe('The rule content/description'),
      scope: z.enum(['GLOBAL', 'BACKEND', 'FRONTEND', 'DATABASE', 'API', 'TESTING', 'DEVOPS']).optional(),
      enforcement: z.enum(['MUST', 'SHOULD', 'MAY']).optional().describe('Enforcement level'),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'rule.update',
    'Update a rule',
    {
      project: p,
      id: z.string().describe('Rule ID'),
      title: z.string().optional(),
      content: z.string().optional(),
      scope: z.enum(['GLOBAL', 'BACKEND', 'FRONTEND', 'DATABASE', 'API', 'TESTING', 'DEVOPS']).optional(),
      enforcement: z.enum(['MUST', 'SHOULD', 'MAY']).optional(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, id, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.update(auth, slug, id, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Rule not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'rule.activate',
    'Re-activate a previously deactivated rule',
    {
      project: p,
      id: z.string().describe('Rule ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.activate(auth, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Rule not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'rule.deactivate',
    'Deactivate a rule (soft-disable)',
    {
      project: p,
      id: z.string().describe('Rule ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await ruleService.deactivate(auth, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Rule not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
