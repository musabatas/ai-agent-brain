import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateDecisionSchema } from '@/lib/schemas/decision.schema';
import { decisionService } from '@/lib/services/decision.service';

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
    const decision = await decisionService.get(auth.orgId, slug, id);
    if (!decision) {
      return NextResponse.json({ message: 'Decision not found' }, { status: 404 });
    }

    return NextResponse.json({ data: decision });
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
    const parsed = UpdateDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const decision = await decisionService.update(auth, slug, id, parsed.data);
    if (!decision) {
      return NextResponse.json({ message: 'Decision not found' }, { status: 404 });
    }

    return NextResponse.json({ data: decision });
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
    const decision = await decisionService.delete(auth, slug, id);
    if (!decision) {
      return NextResponse.json({ message: 'Decision not found' }, { status: 404 });
    }

    return NextResponse.json({ data: decision });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
