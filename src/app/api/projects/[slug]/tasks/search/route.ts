import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, badRequest } from '@/lib/api-response';
import { taskService } from '@/features/projects/services/task.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q) return badRequest('Search query is required');

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const tasks = await taskService.search(auth.orgId, slug, q, limit);
    return ok(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}
