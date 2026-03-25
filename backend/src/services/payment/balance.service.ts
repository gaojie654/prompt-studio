/**
 * 余额与交易服务
 * 处理用户余额充值、消费、退款等操作
 */

import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { TransactionType } from '@prisma/client';
import { MEMBERSHIP_CARDS } from './types';

export interface RechargeInput {
  userId: string;
  credits: number;
  orderId: string;
  amount: number;
}

export interface MembershipPurchaseInput {
  userId: string;
  cardType: 'month' | 'year';
  orderId: string;
  amount: number;
}

export interface BalanceInfo {
  credits: number;
  balance: number;
  tier: string;
  cardType: string | null;
  cardExpiresAt: Date | null;
  expiresAt: Date | null;
}

export class BalanceService {
  /**
   * 获取用户余额和积分信息
   */
  async getBalance(userId: string): Promise<BalanceInfo> {
    const membership = await prisma.membership.findUnique({
      where: { userId },
    });

    if (!membership) {
      // Create default free membership
      const newMembership = await prisma.membership.create({
        data: {
          userId,
          tier: 'FREE',
          credits: 100,
          totalCredits: 100,
          balance: 0,
        },
      });
      return {
        credits: newMembership.credits,
        balance: newMembership.balance,
        tier: newMembership.tier,
        cardType: null,
        cardExpiresAt: null,
        expiresAt: null,
      };
    }

    return {
      credits: membership.credits,
      balance: membership.balance,
      tier: membership.tier,
      cardType: membership.cardType,
      cardExpiresAt: membership.cardExpiresAt,
      expiresAt: membership.expiresAt,
    };
  }

  /**
   * 充值积分
   */
  async rechargeCredits(input: RechargeInput): Promise<void> {
    const { userId, credits, orderId, amount: _amount } = input;

    await prisma.$transaction(async (tx) => {
      // Get current membership
      const membership = await tx.membership.findUnique({
        where: { userId },
      });

      if (!membership) {
        throw new AppError('用户会员信息不存在', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const balanceBefore = membership.credits;

      // Update credits
      const updated = await tx.membership.update({
        where: { userId },
        data: {
          credits: { increment: credits },
          totalCredits: { increment: credits },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.RECHARGE,
          amount: credits,
          balanceBefore,
          balanceAfter: updated.credits,
          orderId,
          description: `充值${credits}积分`,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    });
  }

  /**
   * 购买会员卡
   */
  async purchaseMembership(input: MembershipPurchaseInput): Promise<void> {
    const { userId, cardType, orderId, amount: _amount } = input;

    // Find card config
    const card = MEMBERSHIP_CARDS.find((c) => c.type === cardType);
    if (!card) {
      throw new AppError('无效的会员卡类型', 400, 'INVALID_CARD_TYPE');
    }

    // Find tier based on card type
    const tierMap: Record<string, 'BASIC' | 'PRO'> = {
      month: 'BASIC',
      year: 'PRO',
    };
    const tier = tierMap[cardType];

    await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { userId },
      });

      if (!membership) {
        throw new AppError('用户会员信息不存在', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const balanceBefore = membership.credits;
      const now = new Date();

      // Calculate new expiry
      let newCardExpiresAt: Date;

      if (membership.cardExpiresAt && membership.cardExpiresAt > now) {
        // Extend existing card
        newCardExpiresAt = new Date(membership.cardExpiresAt);
        newCardExpiresAt.setDate(newCardExpiresAt.getDate() + card.durationDays);
      } else {
        // Start new card from now
        newCardExpiresAt = new Date(now);
        newCardExpiresAt.setDate(newCardExpiresAt.getDate() + card.durationDays);
      }

      // Calculate daily credits allocation (for simplicity, add all daily credits at once)
      const dailyCredits = cardType === 'month' ? 500 : 1000;
      const totalCreditsToAdd = dailyCredits * card.durationDays;

      // Update membership
      const updated = await tx.membership.update({
        where: { userId },
        data: {
          tier,
          credits: { increment: totalCreditsToAdd },
          totalCredits: { increment: totalCreditsToAdd },
          cardType,
          cardExpiresAt: newCardExpiresAt,
          expiresAt: newCardExpiresAt,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.MEMBERSHIP,
          amount: totalCreditsToAdd,
          balanceBefore,
          balanceAfter: updated.credits,
          orderId,
          description: `购买${card.label}（${totalCreditsToAdd}积分）`,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          metadata: { cardType, tier },
        },
      });
    });
  }

  /**
   * 消费积分（生成图片等）
   */
  async consumeCredits(userId: string, amount: number, description: string): Promise<void> {
    if (amount <= 0) {
      throw new AppError('消费积分必须大于0', 400, 'INVALID_AMOUNT');
    }

    await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { userId },
      });

      if (!membership) {
        throw new AppError('用户会员信息不存在', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      if (membership.credits < amount) {
        throw new AppError('积分不足', 402, 'INSUFFICIENT_CREDITS');
      }

      const balanceBefore = membership.credits;

      const updated = await tx.membership.update({
        where: { userId },
        data: {
          credits: { decrement: amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.CONSUME,
          amount: -amount,
          balanceBefore,
          balanceAfter: updated.credits,
          description,
        },
      });
    });
  }

  /**
   * 退款
   */
  async refund(userId: string, orderId: string, amount: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { userId },
      });

      if (!membership) {
        throw new AppError('用户会员信息不存在', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const balanceBefore = membership.credits;

      const updated = await tx.membership.update({
        where: { userId },
        data: {
          credits: { increment: amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.REFUND,
          amount,
          balanceBefore,
          balanceAfter: updated.credits,
          orderId,
          description: `退款${amount}积分`,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });
    });
  }

  /**
   * 获取交易记录
   */
  async getTransactions(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { orderNo: true, type: true },
          },
        },
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

export const balanceService = new BalanceService();
