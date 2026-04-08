import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { UpdateRuleSchema } from '@/lib/schemas/rule.schema';
import { ruleService } from '@/lib/services/rule.service';

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
    const rule = await ruleService.get(auth.orgId, slug, id);
    if (!rule) {
      return NextResponse.json({ message: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rule });
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
    const parsed = UpdateRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
    }

    const rule = await ruleService.update(auth, slug, id, parsed.data);
    if (!rule) {
      return NextResponse.json({ message: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rule });
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
    const rule = await ruleService.delete(auth, slug, id);
    if (!rule) {
      return NextResponse.json({ message: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rule });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
