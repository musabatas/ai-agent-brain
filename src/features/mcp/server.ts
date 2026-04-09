import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthContext } from '@/lib/auth';
import { registerProjectTools } from './tools/project-tools';
import { registerFeatureTools } from './tools/feature-tools';
import { registerTaskTools } from './tools/task-tools';
import { registerDecisionTools } from './tools/decision-tools';
import { registerRuleTools } from './tools/rule-tools';
import { registerDocumentTools } from './tools/document-tools';
import { registerMemoryTools } from './tools/memory-tools';
import { registerContextTools } from './tools/context-tools';
import { registerImportTools } from './tools/import-tools';
import { registerCommentTools } from './tools/comment-tools';

/**
 * Create a new MCP server instance with all tools registered.
 * Each request gets its own server instance (stateless).
 *
 * @param auth - Authenticated user/org context
 * @param defaultProject - Optional default project slug from X-Project-Slug header.
 *   When set, tools use this as fallback when the `project` param is omitted.
 */
export function createMcpServer(
  auth: AuthContext,
  defaultProject?: string,
): McpServer {
  const server = new McpServer({
    name: 'ai-dev-brain',
    version: '1.0.0',
  });

  registerProjectTools(server, auth, defaultProject);
  registerFeatureTools(server, auth, defaultProject);
  registerTaskTools(server, auth, defaultProject);
  registerDecisionTools(server, auth, defaultProject);
  registerRuleTools(server, auth, defaultProject);
  registerDocumentTools(server, auth, defaultProject);
  registerMemoryTools(server, auth, defaultProject);
  registerContextTools(server, auth, defaultProject);
  registerImportTools(server, auth, defaultProject);
  registerCommentTools(server, auth, defaultProject);

  return server;
}
