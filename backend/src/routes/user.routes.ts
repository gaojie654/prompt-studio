import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';

const router = Router();

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // TODO: Get current user
  res.json({ user: req.user });
}));

router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  // TODO: Update current user
  res.json({ message: 'Update user endpoint' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: Get user by ID
  res.json({ message: 'Get user endpoint' });
}));

export default router;
