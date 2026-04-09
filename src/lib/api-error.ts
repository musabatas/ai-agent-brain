import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standardized API error handler.
 * Differentiates validation errors (400) from server errors (500).
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: 'Invalid input.', details: error.flatten() },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('API error:', error);
  }

  return NextResponse.json(
    { message: 'Oops! Something went wrong. Please try again in a moment.' },
    { status: 500 },
  );
}
