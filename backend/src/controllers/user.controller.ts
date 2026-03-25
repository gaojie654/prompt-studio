import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/AppError';
import { AppError } from '../utils/AppError';

/**
 * GET /api/users/me
 * Get current user info
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const user = await userService.getById(req.user.userId);

  res.json({
    code: 0,
    message: 'success',
    data: user,
  });
});

/**
 * PUT /api/users/me
 * Update current user info
 */
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const { name, avatar } = req.body;

  const user = await userService.update(req.user.userId, { name, avatar });

  res.json({
    code: 0,
    message: 'User updated successfully',
    data: user,
  });
});

/**
 * GET /api/users/balance
 * Get user balance/credits
 */
export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const balance = await userService.getBalance(req.user.userId);

  res.json({
    code: 0,
    message: 'success',
    data: balance,
  });
});
