import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { UpdateFeatureSchema } from '@/lib/schemas/feature.schema';
import { featureService } from '@/lib/services/feature.service';

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
    const feature = await featureService.get(auth.orgId, slug, id);
    if (!feature) {
      return NextResponse.json({ message: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feature });
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
    const parsed = UpdateFeatureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const feature = await featureService.update(auth, slug, id, parsed.data);
    if (!feature) {
      return NextResponse.json({ message: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feature });
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
    const feature = await featureService.delete(auth, slug, id);
    if (!feature) {
      return NextResponse.json({ message: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feature });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
