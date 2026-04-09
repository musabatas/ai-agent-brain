import { NextRequest } from 'next/server';

/**
 * apiFetch - universal fetch for dev/prod that prefixes API calls with the correct base URL
 *
 * Usage:
 *   apiFetch('/users', { method: 'GET' })
 *   apiFetch('https://external.com/endpoint') // untouched
 */
export async function apiFetch(
  input: string | Request,
  init?: RequestInit,
): Promise<Response> {
  let url = input;

  // If input is a string and is a relative API path, prefix with base URL
  if (typeof input === 'string') {
    if (input.startsWith('/api/')) {
      // Remove leading slash to avoid double slashes
      url =
        process.env.NEXT_PUBLIC_BASE_PATH +
        (input.startsWith('/') ? input : '/' + input);
    }
  }
  // If input is a Request object, you could extend logic here if needed

  return fetch(url as RequestInfo, init);
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    //|| request.socket.remoteAddress
    'unknown'
  );
}
