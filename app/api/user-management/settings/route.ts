import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    // Get settings
    const settings = await prisma.systemSetting.findFirst();

    // Fetch all roles from the UserRole table and sort by name
    const roles = await prisma.userRole.findMany({
      select: { id: true, name: true }, // Adjust selection based on your schema
      orderBy: { name: 'asc' }, // Sort by name in ascending order
    });

    // Return the setting and sorted role list data
    return NextResponse.json({ settings, roles });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
