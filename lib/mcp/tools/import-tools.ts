import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthContext } from '@/lib/auth';

/**
 * Token-efficient import tools.
 *
 * Instead of passing large file content through MCP tool parameters
 * (which costs output tokens), agents can use `import.file` to get
 * a pre-built curl command that pipes file content directly via HTTP.
 *
 * Flow:
 * 1. Agent calls import.file({ filePath, entity, ... }) → ~100 output tokens
 * 2. Tool returns a curl command
 * 3. Agent runs curl via bash → file content goes disk→HTTP, zero model tokens
 * 4. Result comes back as tool output (input tokens, cheaper)
 *
 * Token savings: ~40K output tokens → ~100 output tokens for a typical file.
 */
export function registerImportTools(
  server: McpServer,
  auth: AuthContext,
  defaultProject?: string,
) {
  server.tool(
    'import.file',
    'Token-efficient file import. Returns a bash command that pipes file content directly to the server via curl, bypassing model output token generation. Use this for any content >2K tokens (plans, ADRs, docs, rules, etc.) instead of passing content inline.',
    {
      project: z
        .string()
        .optional()
        .describe(
          'Project slug (optional if X-Project-Slug header is set)',
        ),
      filePath: z
        .string()
        .describe('Absolute path to the file to import'),
      entity: z
        .enum([
          'feature',
          'task',
          'decision',
          'rule',
          'document',
          'memory',
        ])
        .describe('Target entity type'),
      action: z
        .enum(['create', 'update'])
        .default('create')
        .describe('Create new entity or update existing'),
      id: z
        .string()
        .optional()
        .describe('Entity ID (required for update, except memory)'),
      field: z
        .string()
        .default('content')
        .describe(
          'Which field receives the file content. E.g. "plan" for feature plan, "content" for docs/rules, "context" or "decision" for ADRs, "value" for memory, "description" for features/tasks.',
        ),
      extraData: z
        .record(z.unknown())
        .optional()
        .describe(
          'Additional fields to include (e.g. title, status, type, tags). Merged with file content.',
        ),
    },
    async ({ project, filePath, entity, action, id, field, extraData }) => {
      const slug = project ?? defaultProject;
      if (!slug) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No project specified. Pass a project slug or set X-Project-Slug header.',
            },
          ],
          isError: true as const,
        };
      }

      // Build the jq expression to construct JSON with file content
      const dataFields = extraData ? JSON.stringify(extraData) : '{}';
      const jqMerge = `--rawfile filecontent '${filePath}'`;
      const jqExpr = `'${JSON.stringify({ entity, action, ...(id ? { id } : {}), data: '__PLACEHOLDER__' })}'.replace("__PLACEHOLDER__", ($extra + {(\"${field}\"): $filecontent} | tojson))`;

      // Simpler approach: use jq to build the full JSON
      const bashCommand = [
        `# Import ${filePath} → ${entity}.${field} (${action})`,
        `# This command pipes file content directly to the server, saving ~tokens`,
        `jq -n \\`,
        `  --rawfile filecontent '${filePath}' \\`,
        `  --argjson extra '${dataFields}' \\`,
        `  '{`,
        `    entity: "${entity}",`,
        `    action: "${action}",`,
        ...(id ? [`    id: "${id}",`] : []),
        `    data: ($extra + {("${field}"): $filecontent})`,
        `  }' \\`,
        `  | curl -s -X POST \\`,
        `    -H "Authorization: Bearer ${auth.apiKeyId ? '$API_KEY' : 'YOUR_API_KEY'}" \\`,
        `    -H "Content-Type: application/json" \\`,
        `    -d @- \\`,
        `    "${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/projects/${slug}/import"`,
      ].join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `Execute this bash command to import the file content directly (saves output tokens):`,
              '',
              '```bash',
              bashCommand,
              '```',
              '',
              `This pipes the content of \`${filePath}\` directly to the import endpoint.`,
              `The file content never passes through model output, saving ~tokens proportional to file size.`,
            ].join('\n'),
          },
        ],
      };
    },
  );
}
