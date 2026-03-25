import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/AppError';

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const tokens = await authService.register({ email, password, name });

  res.status(201).json({
    code: 0,
    message: 'Registration successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const tokens = await authService.login({ email, password });

  res.json({
    code: 0,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({
      code: 'MISSING_REFRESH_TOKEN',
      message: 'Refresh token is required',
    });
    return;
  }

  const tokens = await authService.refreshToken(refreshToken);

  res.json({
    code: 0,
    message: 'Token refreshed',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (req.user && refreshToken) {
    await authService.logout(req.user.userId);
  }

  res.json({
    code: 0,
    message: 'Logout successful',
  });
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await authService.logoutAll(req.user.userId);
  }

  res.json({
    code: 0,
    message: 'Logged out from all devices',
  });
});
