import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateFeatureSchema } from '@/features/projects/schemas/feature.schema';
import { featureService } from '@/features/projects/services/feature.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const feature = await featureService.get(auth.orgId, slug, id);
    if (!feature) return notFound('Feature');

    return ok(feature);
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
    const parsed = UpdateFeatureSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const feature = await featureService.update(auth, slug, id, parsed.data);
    if (!feature) return notFound('Feature');

    return ok(feature);
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
    const feature = await featureService.delete(auth, slug, id);
    if (!feature) return notFound('Feature');

    return ok(feature);
  } catch (error) {
    return handleApiError(error);
  }
}
