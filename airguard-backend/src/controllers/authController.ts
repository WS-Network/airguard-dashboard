import { Request, Response } from 'express';
import { authService } from '@/services/authService';
import { validateData, signupSchema, loginSchema } from '@/utils/validation';
import type { ApiResponse, AuthResponse } from '@/types';

export class AuthController {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateData(signupSchema, req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
        return;
      }

      const result = await authService.signup(req.body);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = validateData(loginSchema, req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
        return;
      }

      const result = await authService.login(req.body);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
        message: 'Login successful'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      await authService.logout(req.user.id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Logout successful'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
        return;
      }

      const result = await authService.refreshToken(refreshToken);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: req.user,
        message: 'Profile retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}

export const authController = new AuthController(); 