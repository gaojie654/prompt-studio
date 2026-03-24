import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';
import {
  getCurrentUser,
  updateCurrentUser,
  getBalance,
  getUserConsumptions,
  deductBalance,
} from '../controllers/user.controller';

const router = Router();

// 当前用户
router.get('/me', authenticate, asyncHandler(getCurrentUser));
router.patch('/me', authenticate, asyncHandler(updateCurrentUser));

// 余额
router.get('/balance', authenticate, asyncHandler(getBalance));
router.patch('/balance/deduct', authenticate, asyncHandler(deductBalance));

// 消费记录
router.get('/consumptions', authenticate, asyncHandler(getUserConsumptions));

export default router;
