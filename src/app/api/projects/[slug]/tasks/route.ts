import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { created, unauthorized, badRequest } from '@/lib/api-response';
import { CreateTaskSchema } from '@/features/projects/schemas/task.schema';
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
    const status = searchParams.get('status') ?? undefined;
    const featureId = searchParams.get('featureId') ?? undefined;
    const priority = searchParams.get('priority') ?? undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const search = searchParams.get('search') ?? undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const result = await taskService.list(auth.orgId, slug, {
      status,
      featureId,
      priority,
      tags,
      search,
      limit,
      offset,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const body = await req.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const task = await taskService.create(auth, slug, parsed.data);
    return created(task);
  } catch (error) {
    return handleApiError(error);
  }
}
