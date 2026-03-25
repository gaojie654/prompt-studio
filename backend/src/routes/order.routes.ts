import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';

const router = Router();

router.get('/', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // TODO: List orders - use /api/v1/payment/orders instead
  res.json({ orders: [] });
}));

router.get('/:id', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Get order by ID - use /api/v1/payment/orders/:id instead
  res.json({ order: null });
}));

router.post('/', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Create order - use /api/v1/payment/recharge or /api/v1/payment/membership instead
  res.status(201).json({ message: 'Create order endpoint - use /api/v1/payment routes' });
}));

router.post('/:id/pay', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Pay order - payment is handled by /api/v1/payment routes
  res.json({ message: 'Pay order endpoint - payment is handled by /api/v1/payment routes' });
}));

export default router;
