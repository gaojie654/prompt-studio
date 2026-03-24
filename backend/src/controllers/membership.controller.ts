import { Request, Response, NextFunction } from 'express';
import { getMembershipInfo, activateMembership } from '../services/membership.service';
import { AppError } from '../utils/AppError';
import { MembershipTier } from '@prisma/client';

/**
 * 获取当前用户会员信息
 * GET /api/v1/membership
 */
export async function getMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const membership = await getMembershipInfo(userId);

    res.json({
      code: 0,
      message: 'success',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 开通/升级会员（由支付回调调用）
 * POST /api/v1/membership/activate
 */
export async function upgradeMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { tier, durationDays } = req.body as {
      tier: MembershipTier;
      durationDays: number;
    };

    if (!tier || !durationDays) {
      throw new AppError('缺少必要参数', 400, 'INVALID_PARAMS');
    }

    const membership = await activateMembership(userId, tier, durationDays);

    res.json({
      code: 0,
      message: 'success',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}
