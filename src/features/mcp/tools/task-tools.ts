import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { taskService } from '@/features/projects/services/task.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerTaskTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'task.list',
    'List tasks for a project, filterable by status, feature, priority, and tags',
    {
      project: p,
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
      featureId: z.string().optional().describe('Filter by feature ID'),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      limit: z.number().default(50),
      offset: z.number().default(0),
    },
    async ({ project, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.list(auth.orgId, slug, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'task.get',
    'Get a task by ID',
    {
      project: p,
      id: z.string().describe('Task ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.get(auth.orgId, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Task not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'task.create',
    'Create a new task in a project',
    {
      project: p,
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      featureId: z.string().optional().describe('Link to a feature'),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      sortOrder: z.number().int().optional().describe('Execution order (lower = first). Independent of priority.'),
      dependsOn: z.array(z.string()).optional().describe('IDs of tasks this depends on (blocked by)'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'task.update',
    'Update a task',
    {
      project: p,
      id: z.string().describe('Task ID'),
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      featureId: z.string().nullable().optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
      priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
      sortOrder: z.number().int().optional().describe('Execution order (lower = first)'),
      dependsOn: z.array(z.string()).optional().describe('IDs of tasks this depends on (blocked by)'),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, id, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.update(auth, slug, id, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Task not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'task.complete',
    'Mark a task as done',
    {
      project: p,
      id: z.string().describe('Task ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.complete(auth, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Task not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'task.search',
    'Full-text search across tasks in a project',
    {
      project: p,
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async ({ project, query, limit }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await taskService.search(auth.orgId, slug, query, limit);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
