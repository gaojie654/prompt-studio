import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  // TODO: Implement registration logic
  res.status(201).json({ message: 'Registration endpoint' });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  // TODO: Implement login logic
  res.json({ message: 'Login endpoint' });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  // TODO: Implement token refresh logic
  res.json({ message: 'Refresh endpoint' });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  // TODO: Implement logout logic
  res.json({ message: 'Logout endpoint' });
}));

export default router;
