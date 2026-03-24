import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { JwtPayload } from './auth';

/**
 * Admin authentication middleware
 * Verifies that the current user is an admin
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
  }

  const payload = req.user as JwtPayload;

  if (payload.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  }

  next();
};
