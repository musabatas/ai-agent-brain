import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { contextService } from '@/lib/services/context.service';

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
    const result = await contextService.onboard(auth.orgId, slug);
    if (!result) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ message: 'Oops! Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}
