import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { documentService } from '@/features/projects/services/document.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerDocumentTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'document.list',
    'List documents for a project, filterable by type and tags',
    {
      project: p,
      type: z.enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE']).optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    },
    async ({ project, ...filters }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await documentService.list(auth.orgId, slug, filters);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'document.get',
    'Get a document by ID',
    {
      project: p,
      id: z.string().describe('Document ID'),
    },
    async ({ project, id }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await documentService.get(auth.orgId, slug, id);
      if (!result) return { content: [{ type: 'text' as const, text: 'Document not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'document.create',
    'Create a new document (note, spec, guide, runbook, or reference)',
    {
      project: p,
      title: z.string().describe('Document title'),
      content: z.string().describe('Document content (markdown)'),
      type: z.enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE']).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await documentService.create(auth, slug, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'document.update',
    'Update a document',
    {
      project: p,
      id: z.string().describe('Document ID'),
      title: z.string().optional(),
      content: z.string().optional(),
      type: z.enum(['NOTE', 'SPEC', 'GUIDE', 'RUNBOOK', 'REFERENCE']).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ project, id, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await documentService.update(auth, slug, id, data);
      if (!result) return { content: [{ type: 'text' as const, text: 'Document not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'document.search',
    'Full-text search across documents in a project',
    {
      project: p,
      query: z.string().describe('Search query'),
      limit: z.number().default(20),
    },
    async ({ project, query, limit }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await documentService.search(auth.orgId, slug, query, limit);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
