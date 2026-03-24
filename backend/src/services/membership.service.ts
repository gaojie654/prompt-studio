import { prisma } from '../utils/prisma';
import { MembershipTier } from '@prisma/client';

// 会员等级配置
export const MEMBERSHIP_CONFIG: Record<MembershipTier, { name: string; dailyQuota: number }> = {
  FREE: { name: '免费用户', dailyQuota: 5 },
  MONTHLY: { name: '月卡会员', dailyQuota: 50 },
  YEARLY: { name: '年卡会员', dailyQuota: 100 },
  VIP: { name: 'VIP会员', dailyQuota: 200 },
};

// 会员等级名称映射
export const TIER_NAME_MAP: Record<string, string> = {
  FREE: '免费用户',
  MONTHLY: '月卡会员',
  YEARLY: '年卡会员',
  VIP: 'VIP会员',
};

// 会员等级每日额度
export const TIER_DAILY_QUOTA: Record<string, number> = {
  FREE: 5,
  MONTHLY: 50,
  YEARLY: 100,
  VIP: 200,
};

/**
 * 获取用户会员信息
 */
export async function getMembershipInfo(userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return {
      level: 'FREE',
      name: TIER_NAME_MAP['FREE'],
      expiresAt: null,
      dailyQuota: TIER_DAILY_QUOTA['FREE'],
      isActive: false,
    };
  }

  const isActive = membership.expiresAt ? new Date(membership.expiresAt) > new Date() : true;

  return {
    level: membership.tier,
    name: TIER_NAME_MAP[membership.tier] || '未知会员',
    expiresAt: membership.expiresAt,
    dailyQuota: TIER_DAILY_QUOTA[membership.tier] || 5,
    isActive,
  };
}

/**
 * 开通/续费会员
 */
export async function activateMembership(
  userId: string,
  tier: MembershipTier,
  durationDays: number
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const membership = await prisma.membership.upsert({
    where: { userId },
    update: {
      tier,
      expiresAt,
    },
    create: {
      userId,
      tier,
      expiresAt,
    },
  });

  // 记录消费日志
  await prisma.consumption.create({
    data: {
      userId,
      type: 'membership',
      amount: 0, // 会员开通不在这儿扣余额，余额扣款在支付流程
      description: `开通${TIER_NAME_MAP[tier] || tier}`,
    },
  });

  return membership;
}

/**
 * 获取用户每日额度
 */
export async function getUserDailyQuota(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 检查是否需要重置每日额度
  const now = new Date();
  const lastReset = new Date(user.lastQuotaResetAt);
  const isSameDay = now.toDateString() === lastReset.toDateString();

  let dailyQuota = TIER_DAILY_QUOTA['FREE'];
  if (user.membership) {
    const tier = user.membership.tier;
    dailyQuota = TIER_DAILY_QUOTA[tier] || 5;

    // 检查会员是否过期
    if (user.membership.expiresAt && new Date(user.membership.expiresAt) < now) {
      dailyQuota = TIER_DAILY_QUOTA['FREE'];
    }
  }

  // 如果不是同一天，重置额度
  if (!isSameDay) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyUsedQuota: 0,
        lastQuotaResetAt: now,
      },
    });
    return { dailyQuota, usedToday: 0, remainingToday: dailyQuota };
  }

  return {
    dailyQuota,
    usedToday: user.dailyUsedQuota,
    remainingToday: Math.max(0, dailyQuota - user.dailyUsedQuota),
  };
}

/**
 * 使用额度（扣减每日额度）
 */
export async function useQuota(userId: string, amount: number = 1) {
  const quotaInfo = await getUserDailyQuota(userId);

  if (quotaInfo.remainingToday < amount) {
    throw new Error('今日额度不足');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyUsedQuota: {
        increment: amount,
      },
    },
  });

  // 记录消费日志
  await prisma.consumption.create({
    data: {
      userId,
      type: 'generate',
      amount: -amount,
      description: `生成图片 x${amount}`,
    },
  });

  return true;
}

/**
 * 重置所有用户每日额度（定时任务调用）
 */
export async function resetAllUsersDailyQuota() {
  const now = new Date();

  // 重置所有用户
  const result = await prisma.user.updateMany({
    data: {
      dailyUsedQuota: 0,
      lastQuotaResetAt: now,
    },
  });

  console.log(`[QuotaReset] 重置了 ${result.count} 个用户的每日额度`);
  return result.count;
}
