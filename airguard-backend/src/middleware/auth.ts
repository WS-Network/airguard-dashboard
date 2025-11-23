import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService';
import type { User } from '@/types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
    return;
  }

  try {
    const user = await authService.validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}

export function requireOrganization(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.organizationId) {
    res.status(403).json({ 
      success: false, 
      error: 'Organization access required' 
    });
    return;
  }
  next();
} 