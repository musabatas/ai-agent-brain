import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';
import { UserStatus } from '@/app/models/user';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email is required.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.status !== UserStatus.INACTIVE) {
      return NextResponse.json({
        message: 'If your account exists and is not yet verified, a verification email has been sent.',
      });
    }

    // Delete old tokens and create a new one
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.id },
    });

    const token = await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token: bcrypt.hashSync(user.id, 10),
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    const verificationUrl = `${(process.env.NEXTAUTH_URL || '').replace(/\/+$/, '')}/verify-email?token=${token.token}`;

    await sendEmail({
      to: user.email,
      subject: 'Account Activation',
      content: {
        title: `Hello, ${user.name}`,
        subtitle:
          'Click the below link to verify your email address and activate your account.',
        buttonLabel: 'Activate account',
        buttonUrl: verificationUrl,
        description:
          'This link is valid for 1 hour. If you did not request this email you can safely ignore it.',
      },
    });

    return NextResponse.json({
      message: 'If your account exists and is not yet verified, a verification email has been sent.',
    });
  } catch {
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
