import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppError } from '../utils/AppError';

export interface JwtPayload {
  userId: string;
  phone: string;
  type?: string; // 'refresh' for refresh tokens
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('未提供认证令牌', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Reject refresh tokens used as access tokens
    if (decoded.type === 'refresh') {
      return next(new AppError('无效的访问令牌', 401, 'INVALID_TOKEN'));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('令牌无效或已过期', 401, 'INVALID_TOKEN'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('未认证', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role as string)) {
      return next(new AppError('权限不足', 403, 'FORBIDDEN'));
    }

    next();
  };
};
