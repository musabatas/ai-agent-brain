import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { CreateTaskSchema } from '@/lib/schemas/task.schema';
import { taskService } from '@/lib/services/task.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

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
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const task = await taskService.create(auth, slug, parsed.data);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
