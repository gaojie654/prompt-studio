import { prisma } from '../utils/prisma';

/**
 * 获取用户消费记录
 */
export async function getConsumptions(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [consumptions, total] = await Promise.all([
    prisma.consumption.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.consumption.count({ where: { userId } }),
  ]);

  return {
    consumptions: consumptions.map((c) => ({
      id: c.id,
      type: c.type,
      amount: c.amount,
      description: c.description,
      createdAt: c.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 记录消费/充值
 */
export async function createConsumption(
  userId: string,
  type: 'generate' | 'recharge' | 'membership',
  amount: number,
  description?: string
) {
  return prisma.consumption.create({
    data: {
      userId,
      type,
      amount,
      description,
    },
  });
}
