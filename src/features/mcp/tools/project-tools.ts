import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';
import { projectService } from '@/features/projects/services/project.service';

const NO_PROJECT = { content: [{ type: 'text' as const, text: 'No project specified. Pass a project slug or set X-Project-Slug header.' }], isError: true as const };

export function registerProjectTools(server: McpServer, auth: AuthContext, defaultProject?: string) {
  const p = z.string().optional().describe('Project slug. Usually not needed — automatically provided via X-Project-Slug header in your MCP config. Only set this to target a different project.');

  server.tool(
    'project.list',
    'List all projects for the current organization, optionally filtered by status',
    { status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by project status') },
    async ({ status }) => {
      const projects = await projectService.list(auth.orgId, status);
      return { content: [{ type: 'text' as const, text: JSON.stringify(projects, null, 2) }] };
    },
  );

  server.tool(
    'project.get',
    'Get a project by slug or ID',
    { project: p },
    async ({ project }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const result = await projectService.getBySlug(auth.orgId, slug);
      if (!result) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'project.create',
    'Create a new project',
    {
      name: z.string().describe('Project name'),
      description: z.string().optional().describe('Project description'),
      slug: z.string().optional().describe('Custom URL slug (auto-generated if omitted)'),
    },
    async (params) => {
      const project = await projectService.create(auth, params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }] };
    },
  );

  server.tool(
    'project.update',
    'Update a project',
    {
      project: p,
      name: z.string().optional().describe('New project name'),
      description: z.string().nullable().optional().describe('New description'),
      status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional().describe('New status'),
    },
    async ({ project, ...data }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const existing = await projectService.getBySlug(auth.orgId, slug);
      if (!existing) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      const result = await projectService.update(auth, existing.id, data);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'project.archive',
    'Archive a project (soft delete)',
    { project: p },
    async ({ project }) => {
      const slug = project ?? defaultProject;
      if (!slug) return NO_PROJECT;
      const existing = await projectService.getBySlug(auth.orgId, slug);
      if (!existing) return { content: [{ type: 'text' as const, text: 'Project not found' }], isError: true };
      const result = await projectService.archive(auth, existing.id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
