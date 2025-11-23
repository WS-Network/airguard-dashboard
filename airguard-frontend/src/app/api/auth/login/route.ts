/**
 * Login API Route
 *
 * Handles user authentication with email and password
 * Returns JWT tokens in httpOnly cookies
 */

// Force Node.js runtime (required for Prisma and crypto)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import {
  generateAccessToken,
  generateRefreshToken,
  createAccessTokenCookie,
  createRefreshTokenCookie,
  storeRefreshTokenSession,
} from '@/lib/auth';

// Login request body interface
interface LoginRequestBody {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();

    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(body.password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token session
    await storeRefreshTokenSession(user.id, refreshToken);

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || null,
        },
      },
      { status: 200 }
    );

    // Set httpOnly cookies
    response.headers.append('Set-Cookie', createAccessTokenCookie(accessToken));
    response.headers.append('Set-Cookie', createRefreshTokenCookie(refreshToken));

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
