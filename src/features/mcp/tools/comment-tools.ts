import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { commentService } from '@/features/projects/services/comment.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerCommentTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'comment.list',
    'List comments on a specific entity (feature, task, decision, etc.)',
    {
      project: p,
      entityType: z.enum(['feature', 'task', 'decision', 'rule', 'document']).describe('Type of entity'),
      entityId: z.string().describe('Entity ID'),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, entityType, entityId, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await commentService.list(auth.orgId, slug, entityType, entityId, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'comment.create',
    'Add a comment to a feature, task, decision, rule, or document',
    {
      project: p,
      entityType: z.enum(['feature', 'task', 'decision', 'rule', 'document']).describe('Type of entity to comment on'),
      entityId: z.string().describe('Entity ID'),
      content: z.string().describe('Comment text (markdown supported)'),
      parentId: z.string().optional().describe('Parent comment ID for threading'),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await commentService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
