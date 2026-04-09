import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { ok, unauthorized, notFound, badRequest } from '@/lib/api-response';
import { UpdateDocumentSchema } from '@/features/projects/schemas/document.schema';
import { documentService } from '@/features/projects/services/document.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const { slug, id } = await params;
    const document = await documentService.get(auth.orgId, slug, id);
    if (!document) return notFound('Document');

    return ok(document);
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
    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input.', parsed.error.flatten());

    const document = await documentService.update(auth, slug, id, parsed.data);
    if (!document) return notFound('Document');

    return ok(document);
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
    const document = await documentService.delete(auth, slug, id);
    if (!document) return notFound('Document');

    return ok(document);
  } catch (error) {
    return handleApiError(error);
  }
}
