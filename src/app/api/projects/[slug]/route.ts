import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateProjectSchema } from '@/features/projects/schemas/project.schema';
import { projectService } from '@/features/projects/services/project.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug } = await params;
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) return notFound('Project');

    return ok(project);
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
    if (!auth) return unauthorized();

    const { slug } = await params;
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) return notFound('Project');

    const body = await req.json();
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const updated = await projectService.update(auth, project.id, parsed.data);
    return ok(updated);
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
    if (!auth) return unauthorized();

    const { slug } = await params;
    const project = await projectService.getBySlug(auth.orgId, slug);
    if (!project) return notFound('Project');

    const archived = await projectService.archive(auth, project.id);
    return ok(archived);
  } catch (error) {
    return handleApiError(error);
  }
}
