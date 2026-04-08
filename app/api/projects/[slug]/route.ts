import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateProjectSchema } from '@/lib/schemas/project.schema';
import { projectService } from '@/lib/services/project.service';

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
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug } = await params;
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await projectService.update(auth, project.id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug } = await params;
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const archived = await projectService.archive(auth, project.id);
    return NextResponse.json({ data: archived });
  } catch (error) {
    return handleApiError(error);
  }
}
