/**
 * Logout API Route
 *
 * Handles user logout by clearing cookies and removing refresh token session
 */

// Force Node.js runtime (required for database operations)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getTokensFromRequest, deleteRefreshTokenSession, getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user and clear authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from access token
    const user = getUserFromRequest(request);

    // Get refresh token to delete session
    const { refreshToken } = getTokensFromRequest(request);

    // Delete refresh token session from database if available
    if (user && refreshToken) {
      await deleteRefreshTokenSession(user.userId, refreshToken);
    }

    // Create response
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear authentication cookies
    const clearedCookies = clearAuthCookies();
    clearedCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, clear cookies for security
    const response = NextResponse.json(
      { message: 'Logout completed' },
      { status: 200 }
    );

    const clearedCookies = clearAuthCookies();
    clearedCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  }
}
