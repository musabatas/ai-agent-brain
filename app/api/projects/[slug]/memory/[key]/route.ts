import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { memoryService } from '@/lib/services/memory.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug, key } = await params;
    const memory = await memoryService.recall(auth.orgId, slug, key);
    if (!memory) {
      return NextResponse.json({ message: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ data: memory });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { slug, key } = await params;
    const memory = await memoryService.delete(auth, slug, key);
    if (!memory) {
      return NextResponse.json({ message: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ data: memory });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
