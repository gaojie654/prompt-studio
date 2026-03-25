import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import { register, login, refresh, logout, logoutAll } from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

router.post('/register', validate(registerSchema), asyncHandler(register));

router.post('/login', validate(loginSchema), asyncHandler(login));

router.post('/refresh', validate(refreshSchema), asyncHandler(refresh));

router.post('/logout', asyncHandler(logout));

router.post('/logout-all', authenticate, asyncHandler(logoutAll));

export default router;
