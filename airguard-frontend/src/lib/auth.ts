/**
 * Authentication Utilities
 *
 * JWT token generation, verification, and cookie management
 * Implements secure token handling with httpOnly cookies
 */

import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import type { NextRequest, NextResponse } from 'next/server';
import { db } from './db';
import crypto from 'crypto';

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-min-32-chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-in-production-min-32-chars';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
// Don't set domain in production - let browser use current domain
const COOKIE_DOMAIN = process.env.NODE_ENV === 'development' ? 'localhost' : undefined;

// Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  organizationId?: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'airguard-web',
    audience: 'airguard-users',
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: 'airguard-web',
    audience: 'airguard-users',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'airguard-web',
      audience: 'airguard-users',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'airguard-web',
      audience: 'airguard-users',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Create httpOnly cookie for access token
 */
export function createAccessTokenCookie(token: string): string {
  const options: any = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes in seconds
    path: '/',
  };

  // Only set domain if defined (localhost in dev, undefined in prod)
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  return serialize('accessToken', token, options);
}

/**
 * Create httpOnly cookie for refresh token
 */
export function createRefreshTokenCookie(token: string): string {
  const options: any = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  };

  // Only set domain if defined (localhost in dev, undefined in prod)
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  return serialize('refreshToken', token, options);
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(): string[] {
  const options: any = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };

  // Only set domain if defined (localhost in dev, undefined in prod)
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  return [
    serialize('accessToken', '', options),
    serialize('refreshToken', '', options),
  ];
}

/**
 * Get tokens from request cookies
 */
export function getTokensFromRequest(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const cookies = parse(request.headers.get('cookie') || '');
  return {
    accessToken: cookies.accessToken || null,
    refreshToken: cookies.refreshToken || null,
  };
}

/**
 * Verify and decode access token from request
 */
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const { accessToken } = getTokensFromRequest(request);
  if (!accessToken) return null;
  return verifyAccessToken(accessToken);
}

/**
 * Store refresh token hash in database for session tracking
 */
export async function storeRefreshTokenSession(
  userId: string,
  refreshToken: string
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.userSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

/**
 * Verify refresh token session exists in database
 */
export async function verifyRefreshTokenSession(
  userId: string,
  refreshToken: string
): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await db.userSession.findFirst({
    where: {
      userId,
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return !!session;
}

/**
 * Delete refresh token session from database
 */
export async function deleteRefreshTokenSession(
  userId: string,
  refreshToken: string
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await db.userSession.deleteMany({
    where: {
      userId,
      tokenHash,
    },
  });
}

/**
 * Delete all user sessions (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.userSession.deleteMany({
    where: {
      userId,
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
