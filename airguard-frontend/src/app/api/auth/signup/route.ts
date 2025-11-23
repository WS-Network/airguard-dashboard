/**
 * Signup API Route
 *
 * Handles user registration with 2-step process:
 * Step 1: Personal info (name, email, password, country, phone)
 * Step 2: Business info (company, industry, type)
 */

// Force Node.js runtime (required for Prisma and crypto)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import {
  generateAccessToken,
  generateRefreshToken,
  createAccessTokenCookie,
  createRefreshTokenCookie,
  storeRefreshTokenSession,
} from '@/lib/auth';

// Signup request body interface
interface SignupRequestBody {
  // Step 1 - Personal Info
  fullName: string;
  email: string;
  password: string;
  country: string;
  phoneNumber: string;

  // Step 2 - Business Info
  companyName: string;
  industry: string;
  businessType: string;
  hearAboutUs: string;

  // Checkboxes
  nonGovernmentEndUser: boolean;
  acceptTerms: boolean;
  newsPromotions: boolean;
}

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignupRequestBody = await request.json();

    // Validation
    if (!body.email || !body.password || !body.fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (!body.acceptTerms) {
      return NextResponse.json(
        { error: 'You must accept the terms of use to sign up' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation (min 8 characters)
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create organization for the user
    const organization = await db.organization.create({
      data: {
        name: body.companyName || `${body.fullName}'s Organization`,
        owner: {
          create: {
            email: body.email.toLowerCase(),
            passwordHash,
            fullName: body.fullName,
            country: body.country || null,
            phoneNumber: body.phoneNumber || null,
            companyName: body.companyName || null,
            industry: body.industry || null,
            businessType: body.businessType || null,
            hearAboutUs: body.hearAboutUs || null,
            nonGovernmentEndUser: body.nonGovernmentEndUser || false,
            acceptTerms: body.acceptTerms,
            newsPromotions: body.newsPromotions || false,
          },
        },
      },
      include: {
        owner: true,
      },
    });

    const user = organization.owner;

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token session
    await storeRefreshTokenSession(user.id, refreshToken);

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organizationId: organization.id,
          organizationName: organization.name,
        },
      },
      { status: 201 }
    );

    // Set httpOnly cookies
    response.headers.append('Set-Cookie', createAccessTokenCookie(accessToken));
    response.headers.append('Set-Cookie', createRefreshTokenCookie(refreshToken));

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}
