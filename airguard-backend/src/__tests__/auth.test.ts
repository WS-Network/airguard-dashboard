import { authService } from '@/services/authService';
import { prisma } from '@/config/database';

describe('AuthService', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('signup', () => {
    it('should create a new user and organization', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        acceptTerms: true,
      };

      const result = await authService.signup(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.fullName).toBe(userData.fullName);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.organizationId).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        acceptTerms: true,
      };

      await authService.signup(userData);

      await expect(authService.signup(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        acceptTerms: true,
      };

      await authService.signup(userData);

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });
}); 