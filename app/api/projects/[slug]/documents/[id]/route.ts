import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateDocumentSchema } from '@/lib/schemas/document.schema';
import { documentService } from '@/lib/services/document.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug, id } = await params;
    const document = await documentService.get(auth.orgId, slug, id);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ data: document });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug, id } = await params;
    const body = await req.json();
    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const document = await documentService.update(auth, slug, id, parsed.data);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ data: document });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug, id } = await params;
    const document = await documentService.delete(auth, slug, id);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ data: document });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
