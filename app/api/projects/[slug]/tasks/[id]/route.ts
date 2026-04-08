import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateTaskSchema } from '@/lib/schemas/task.schema';
import { taskService } from '@/lib/services/task.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const task = await taskService.get(auth.orgId, slug, id);
    if (!task) return notFound('Task');

    return ok(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const body = await req.json();
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const task = await taskService.update(auth, slug, id, parsed.data);
    if (!task) return notFound('Task');

    return ok(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const task = await taskService.delete(auth, slug, id);
    if (!task) return notFound('Task');

    return ok(task);
  } catch (error) {
    return handleApiError(error);
  }
}
