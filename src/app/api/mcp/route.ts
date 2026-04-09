import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getAuthContext } from '@/lib/auth';
import { createMcpServer } from '@/lib/mcp/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: 'mcp', limit: 100, windowMs: 60 * 1000 });
  if (limited) return limited;

  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Unauthorized' },
          id: null,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const defaultProject = req.headers.get('x-project-slug') || undefined;
    const server = createMcpServer(auth, defaultProject);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableJsonResponse: true, // JSON responses instead of SSE for simplicity
    });

    await server.connect(transport);

    // handleRequest takes a standard Request and returns a standard Response
    const response = await transport.handleRequest(req);

    // Clean up
    await server.close();

    return response;
  } catch (error) {
    console.error('MCP route error:', error);
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// GET for SSE stream (server-initiated messages)
export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const defaultProject = req.headers.get('x-project-slug') || undefined;
  const server = createMcpServer(auth, defaultProject);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

// DELETE for session cleanup
export async function DELETE(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  return transport.handleRequest(req);
}
