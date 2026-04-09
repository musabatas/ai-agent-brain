import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, created, unauthorized, badRequest } from '@/lib/api-response';
import { CreateProjectSchema } from '@/features/projects/schemas/project.schema';
import { projectService } from '@/features/projects/services/project.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const status = new URL(req.url).searchParams.get('status') ?? undefined;
    const projects = await projectService.list(auth.orgId, status);
    return ok(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const project = await projectService.create(auth, parsed.data);
    return created(project);
  } catch (error) {
    return handleApiError(error);
  }
}
