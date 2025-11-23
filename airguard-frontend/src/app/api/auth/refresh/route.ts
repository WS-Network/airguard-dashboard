/**
 * Refresh Token API Route
 *
 * Handles token refresh to get a new access token
 * Uses the refresh token from httpOnly cookie
 */

// Force Node.js runtime (required for Prisma and crypto)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getTokensFromRequest,
  verifyRefreshToken,
  verifyRefreshTokenSession,
  generateAccessToken,
  generateRefreshToken,
  createAccessTokenCookie,
  createRefreshTokenCookie,
  deleteRefreshTokenSession,
  storeRefreshTokenSession,
} from '@/lib/auth';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const { refreshToken } = getTokensFromRequest(request);

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify refresh token session exists in database
    const isSessionValid = await verifyRefreshTokenSession(payload.userId, refreshToken);

    if (!isSessionValid) {
      return NextResponse.json(
        { error: 'Refresh token session not found or expired' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete old refresh token session
    await deleteRefreshTokenSession(user.id, refreshToken);

    // Generate new tokens
    const newTokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId || undefined,
    };

    const newAccessToken = generateAccessToken(newTokenPayload);
    const newRefreshToken = generateRefreshToken(newTokenPayload);

    // Store new refresh token session
    await storeRefreshTokenSession(user.id, newRefreshToken);

    // Create response
    const response = NextResponse.json(
      {
        message: 'Token refreshed successfully',
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

    // Set new httpOnly cookies
    response.headers.append('Set-Cookie', createAccessTokenCookie(newAccessToken));
    response.headers.append('Set-Cookie', createRefreshTokenCookie(newRefreshToken));

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'An error occurred during token refresh' },
      { status: 500 }
    );
  }
}
