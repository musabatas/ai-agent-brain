/**
 * Single-source MCP configuration generator.
 * Used by onboarding page and project MCP Config tab.
 */

interface McpConfigOptions {
  origin: string;
  apiKey?: string;
  projectSlug?: string;
}

export function generateMcpConfig({ origin, apiKey, projectSlug }: McpConfigOptions) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey || 'YOUR_API_KEY'}`,
  };

  if (projectSlug) {
    headers['X-Project-Slug'] = projectSlug;
  }

  return {
    mcpServers: {
      'ai-dev-brain': {
        type: 'http',
        url: `${origin}/api/mcp`,
        headers,
      },
    },
  };
}

export function mcpConfigToJson(config: ReturnType<typeof generateMcpConfig>) {
  return JSON.stringify(config, null, 2);
}
