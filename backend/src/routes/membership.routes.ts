import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';
import { balanceService } from '../services/payment/balance.service';

const router = Router();

router.get('/current', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const balance = await balanceService.getBalance(req.user!.userId);
  res.json({ membership: balance });
}));

router.post('/upgrade', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  // 会员升级改由 payment 路由处理，这里保留作为占位
  res.json({ message: '请使用 /api/v1/payment/membership 购买会员' });
}));

export default router;
