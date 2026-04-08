import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { memoryService } from '@/lib/services/memory.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerMemoryTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug or ID (optional if X-Project-Slug header is set)');

  server.tool(
    'memory.store',
    'Store or update a key-value memory entry for a project',
    {
      project: p,
      key: z.string().describe('Memory key (unique per project)'),
      value: z.string().describe('Memory value'),
      type: z.enum(['USER', 'FEEDBACK', 'PROJECT', 'REFERENCE']).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await memoryService.upsert(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'memory.recall',
    'Retrieve a memory entry by key',
    {
      project: p,
      key: z.string().describe('Memory key'),
    },
    async ({ project, key }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await memoryService.recall(auth.orgId, slug, key);
      if (!result) return { content: [{ type: 'text' as const, text: 'Memory not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'memory.list',
    'List all memory entries for a project, optionally filtered by type',
    {
      project: p,
      type: z.enum(['USER', 'FEEDBACK', 'PROJECT', 'REFERENCE']).optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, type, limit, offset }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await memoryService.list(auth.orgId, slug, { type, limit, offset });
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'memory.delete',
    'Delete a memory entry by key',
    {
      project: p,
      key: z.string().describe('Memory key'),
    },
    async ({ project, key }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await memoryService.delete(auth, slug, key);
      if (!result) return { content: [{ type: 'text' as const, text: 'Memory not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: `Deleted memory "${key}"` }] };
    },
  );

  server.tool(
    'memory.search',
    'Search across memory entries in a project',
    {
      project: p,
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async ({ project, query, limit }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await memoryService.search(auth.orgId, slug, query, limit);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
