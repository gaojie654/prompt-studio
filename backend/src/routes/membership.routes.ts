import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';

const router = Router();

router.get('/current', authenticate, asyncHandler(async (req, res) => {
  // TODO: Get current membership
  res.json({ membership: null });
}));

router.post('/upgrade', authenticate, asyncHandler(async (req, res) => {
  // TODO: Upgrade membership
  res.json({ message: 'Upgrade membership endpoint' });
}));

export default router;
