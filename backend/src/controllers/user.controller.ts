import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { getUserDailyQuota, getMembershipInfo } from '../services/membership.service';
import { getConsumptions } from '../services/consumption.service';

/**
 * 获取当前用户
 * GET /api/v1/users/me
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    res.json({
      code: 0,
      message: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新当前用户
 * PATCH /api/v1/users/me
 */
export async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    res.json({
      code: 0,
      message: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户余额和每日额度
 * GET /api/v1/users/balance
 */
export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    const quotaInfo = await getUserDailyQuota(userId);

    res.json({
      code: 0,
      message: 'success',
      data: {
        balance: user.balance,
        dailyQuota: quotaInfo.dailyQuota,
        usedToday: quotaInfo.usedToday,
        remainingToday: quotaInfo.remainingToday,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取消费记录
 * GET /api/v1/users/consumptions
 */
export async function getUserConsumptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getConsumptions(userId, page, limit);

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户余额（余额扣费）
 * PATCH /api/v1/users/balance/deduct
 */
export async function deductBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('扣费金额必须大于0', 400, 'INVALID_AMOUNT');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    if (user.balance < amount) {
      throw new AppError('余额不足', 400, 'INSUFFICIENT_BALANCE');
    }

    // 扣减余额
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    // 记录消费日志
    await prisma.consumption.create({
      data: {
        userId,
        type: 'recharge',
        amount: -amount,
        description: description || '余额扣费',
      },
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    next(error);
  }
}
