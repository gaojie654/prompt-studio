import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';
import { getMembership, upgradeMembership } from '../controllers/membership.controller';

const router = Router();

// 获取当前会员信息
router.get('/', authenticate, asyncHandler(getMembership));

// 开通/升级会员
router.post('/activate', authenticate, asyncHandler(upgradeMembership));

export default router;
