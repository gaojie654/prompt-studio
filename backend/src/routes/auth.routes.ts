import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler, AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import * as authService from '../services/auth.service';
import prisma from '../utils/prisma';

const router = Router();

// --- Validation Schemas ---

const phoneRegex = /^1[3-9]\d{9}$/;

const registerSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: '手机号必填' })
      .regex(phoneRegex, '手机号格式错误，需为11位有效手机号'),
    password: z
      .string({ required_error: '密码必填' })
      .min(6, '密码至少6位'),
    nickname: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    phone: z.string({ required_error: '手机号必填' }),
    password: z.string({ required_error: '密码必填' }),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'refreshToken必填' }),
  }),
});

// --- Routes ---

/**
 * POST /api/v1/auth/register
 * User registration
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { phone, password, nickname } = req.body;

    const result = await authService.register({ phone, password, nickname });

    res.status(201).json({
      code: 0,
      message: 'success',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    const result = await authService.login({ phone, password });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      code: 0,
      message: 'success',
      data: tokens,
    });
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout: revoke refresh token
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      code: 0,
      message: 'success',
      data: null,
    });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user info (protected)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        phone: true,
        nickname: true,
        balance: true,
        memberType: true,
      },
    });

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        balance: user.balance,
        member_type: user.memberType,
      },
    });
  })
);

export default router;
