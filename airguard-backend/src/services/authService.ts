import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { jwtConfig } from '@/config/jwt';
import type { 
  User, 
  CreateUserData, 
  LoginData, 
  AuthResponse, 
  JwtPayload 
} from '@/types';

export class AuthService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
  }

  async signup(userData: CreateUserData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

    // Create organization for the user
    const organization = await prisma.organization.create({
      data: {
        name: userData.companyName || `${userData.fullName}'s Organization`,
        owner: {
          create: {
            email: userData.email,
            passwordHash,
            fullName: userData.fullName,
            country: userData.country || null,
            phoneNumber: userData.phoneNumber || null,
            companyName: userData.companyName || null,
            industry: userData.industry || null,
            businessType: userData.businessType || null,
            hearAboutUs: userData.hearAboutUs || null,
            nonGovernmentEndUser: userData.nonGovernmentEndUser || false,
            acceptTerms: userData.acceptTerms,
            newsPromotions: userData.newsPromotions || false,
          }
        }
      },
      include: {
        owner: true
      }
    });

    // Update user with organization ID
    const user = await prisma.user.update({
      where: { id: organization.ownerId },
      data: { organizationId: organization.id }
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      include: { organization: true }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  async logout(userId: string): Promise<void> {
    // Remove all refresh tokens for the user
    await prisma.userSession.deleteMany({
      where: { userId }
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret) as JwtPayload;
      
      // Check if token exists in database
      const session = await prisma.userSession.findFirst({
        where: {
          userId: payload.userId,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { organization: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update refresh token in database
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          tokenHash: this.hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + this.getRefreshTokenExpiry())
        }
      });

      return {
        user: this.sanitizeUser(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, jwtConfig.secret) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { organization: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateAccessToken(user: any): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      ...(user.organizationId && { organizationId: user.organizationId })
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
  }

  private generateRefreshToken(user: any): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      ...(user.organizationId && { organizationId: user.organizationId })
    };

    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn
    });
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenExpiry());

    await prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  private hashToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  private getRefreshTokenExpiry(): number {
    const days = parseInt(jwtConfig.refreshExpiresIn.replace('d', ''));
    return days * 24 * 60 * 60 * 1000;
  }

  private sanitizeUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      country: user.country,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      industry: user.industry,
      businessType: user.businessType,
      hearAboutUs: user.hearAboutUs,
      nonGovernmentEndUser: user.nonGovernmentEndUser,
      acceptTerms: user.acceptTerms,
      newsPromotions: user.newsPromotions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationId: user.organizationId
    };
  }
}

export const authService = new AuthService(); 