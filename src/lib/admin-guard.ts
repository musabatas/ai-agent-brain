import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

const ADMIN_ROLE_SLUGS = ['admin', 'owner'];

/**
 * Verify the current session user has an admin or owner role.
 * Returns the session if authorized, or a 403 response if not.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: { select: { slug: true } } },
  });

  if (!user?.role || !ADMIN_ROLE_SLUGS.includes(user.role.slug)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: 'Forbidden. Admin access required.' },
        { status: 403 },
      ),
    };
  }

  return { authorized: true as const, session };
}
