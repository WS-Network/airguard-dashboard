/**
 * Profile API Route
 *
 * Handles fetching current user profile information
 * Requires authentication via access token cookie
 */

// Force Node.js runtime (required for Prisma and JWT verification)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from access token
    const tokenPayload = getUserFromRequest(request);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: tokenPayload.userId },
      include: {
        organization: true,
        settings: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        country: true,
        phoneNumber: true,
        companyName: true,
        industry: true,
        businessType: true,
        hearAboutUs: true,
        nonGovernmentEndUser: true,
        newsPromotions: true,
        createdAt: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        settings: {
          select: {
            id: true,
            theme: true,
            language: true,
            notifications: true,
            emailNotifications: true,
            pushNotifications: true,
            timezone: true,
            dateFormat: true,
            timeFormat: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching profile' },
      { status: 500 }
    );
  }
}
