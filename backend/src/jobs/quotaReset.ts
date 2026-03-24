import { prisma } from '../utils/prisma';

/**
 * 每日额度重置定时任务
 * 每天凌晨0点执行
 */
export async function quotaResetJob() {
  console.log('[QuotaReset] 开始执行每日额度重置任务...');

  const now = new Date();

  try {
    // 重置所有用户
    const result = await prisma.user.updateMany({
      data: {
        dailyUsedQuota: 0,
        lastQuotaResetAt: now,
      },
    });

    console.log(`[QuotaReset] 成功重置 ${result.count} 个用户的每日额度`);
    return { success: true, count: result.count };
  } catch (error) {
    console.error('[QuotaReset] 重置每日额度失败:', error);
    return { success: false, error };
  }
}

/**
 * 检查并重置单个用户的每日额度
 * 如果当前日期与 lastQuotaResetAt 不是同一天，则重置
 */
export async function checkAndResetUserQuota(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  const now = new Date();
  const lastReset = new Date(user.lastQuotaResetAt);
  const isSameDay = now.toDateString() === lastReset.toDateString();

  if (!isSameDay) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyUsedQuota: 0,
        lastQuotaResetAt: now,
      },
    });
    return true;
  }

  return false;
}

// 导出任务供调度器调用
export default quotaResetJob;
