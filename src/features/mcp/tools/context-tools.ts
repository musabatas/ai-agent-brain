import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { contextService } from '@/features/projects/services/context.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerContextTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'context.onboard',
    'Get full project context for a new AI session. Returns project info, active features with task counts, open tasks, accepted decisions, active rules, and recent memory entries.',
    { project: p },
    async ({ project }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await contextService.onboard(auth.orgId, slug);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'context.summary',
    'Get a quick project status summary with entity counts and recent activity',
    { project: p },
    async ({ project }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await contextService.summary(auth.orgId, slug);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'context.focus',
    'Get current work focus — in-progress features and in-progress/blocked tasks',
    { project: p },
    async ({ project }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await contextService.focus(auth.orgId, slug);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
