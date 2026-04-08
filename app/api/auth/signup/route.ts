// pages/api/auth/signup.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { sendEmail } from '@/services/send-email';
import {
  getSignupSchema,
  SignupSchemaType,
} from '@/app/(auth)/forms/signup-schema';
import { User, UserStatus } from '@/app/models/user';

// Helper function to generate a verification token and send the email.
async function sendVerificationEmail(user: User) {
  // Create a new verification token.
  const token = await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token: bcrypt.hashSync(user.id, 10),
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    },
  });

  // Construct the verification URL.
  const verificationUrl = `${(process.env.NEXTAUTH_URL || '').replace(/\/+$/, '')}/verify-email?token=${token.token}`;

  // Send the verification email.
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
}

export async function POST(req: NextRequest) {
  try {
    // Skip reCAPTCHA in development
    if (process.env.NODE_ENV !== 'development') {
      const recaptchaToken = req.headers.get('x-recaptcha-token');

      if (!recaptchaToken) {
        return NextResponse.json(
          { message: 'reCAPTCHA verification required' },
          { status: 400 },
        );
      }

      const isValidToken = await verifyRecaptchaToken(recaptchaToken);

      if (!isValidToken) {
        return NextResponse.json(
          { message: 'reCAPTCHA verification failed' },
          { status: 400 },
        );
      }
    }

    // Parse the request body as JSON.
    const body = await req.json();

    // Validate the data using safeParse.
    const result = getSignupSchema().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Invalid input. Please check your data and try again.',
        },
        { status: 400 },
      );
    }

    const { email, password, name }: SignupSchemaType = result.data;

    // Check if a user with the given email already exists.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.INACTIVE) {
        // Resend verification email for inactive user.
        await prisma.verificationToken.deleteMany({
          where: { identifier: existingUser.id },
        });
        await sendVerificationEmail(existingUser);
        return NextResponse.json(
          { message: 'Verification email resent. Please check your email.' },
          { status: 200 },
        );
      } else {
        // User exists and is active.
        return NextResponse.json(
          { message: 'Email is already registered.' },
          { status: 409 },
        );
      }
    }

    const defaultRole = await prisma.userRole.findFirst({
      where: { isDefault: true },
    });

    if (!defaultRole) {
      throw new Error('Default role not found. Unable to create a new user.');
    }

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (org creation handled by onboarding flow)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: UserStatus.INACTIVE,
        roleId: defaultRole.id,
      },
      include: { role: true },
    });

    // Send the verification email.
    await sendVerificationEmail(user);

    return NextResponse.json(
      {
        message:
          'Registration successful. Check your email to verify your account.',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Registration failed. Please try again later.' },
      { status: 500 },
    );
  }
}
