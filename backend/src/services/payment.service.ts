import { prisma } from '../utils/prisma';
import { PAYMENT_CONFIG } from '../config/payment';
import { MEMBERSHIP_PRICES } from '../config/membership';
import {
  generateOrderNo,
  getOrderExpireTime,
  calculateMembershipAmount,
  getPaymentSubject,
  wechatNativePay,
  alipayQrPay,
  verifyWechatSign,
  verifyAlipaySign,
} from '../utils/payment';
import { AppError } from '../utils/AppError';

export type OrderType = 'recharge' | 'membership' | 'points';
export type PaymentMethod = 'wechat' | 'alipay';
export type MembershipLevel = 'monthly' | 'yearly';

interface CreateOrderInput {
  userId: string;
  type: OrderType;
  amount: number;
  method: PaymentMethod;
  level?: MembershipLevel;
}

interface OrderResult {
  orderId: string;
  orderNo: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  qrCode: string;
  payUrl: string;
  expireAt: Date;
}

/** 创建订单 */
export const createOrder = async (input: CreateOrderInput): Promise<OrderResult> => {
  const { userId, type, amount, method, level } = input;

  // 计算金额
  let finalAmount = amount;
  if (type === 'membership' && level) {
    finalAmount = calculateMembershipAmount(level);
  }

  const orderNo = generateOrderNo();
  const expireAt = getOrderExpireTime();
  const subject = getPaymentSubject(type, level);

  // 调用支付接口获取二维码/链接
  let qrCode = '';
  let payUrl = '';

  if (method === 'wechat') {
    const payResult = await wechatNativePay(orderNo, finalAmount, subject, expireAt);
    qrCode = payResult.qrCode;
    payUrl = payResult.payUrl;
  } else {
    const payResult = await alipayQrPay(orderNo, finalAmount, subject, expireAt);
    qrCode = payResult.qrCode;
    payUrl = payResult.payUrl;
  }

  // 保存订单
  const order = await prisma.order.create({
    data: {
      orderNo,
      userId,
      type,
      amount: finalAmount,
      paymentMethod: method.toUpperCase() as 'WECHAT' | 'ALIPAY',
      status: 'PENDING',
      targetId: level || null,
      metadata: {
        expireAt: expireAt.toISOString(),
        qrCode,
        payUrl,
        originalAmount: amount,
      },
    },
  });

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    amount: order.amount,
    method,
    status: order.status.toLowerCase(),
    qrCode,
    payUrl,
    expireAt,
  };
};

/** 查询用户订单列表 */
export const listOrders = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        orderNo: true,
        type: true,
        amount: true,
        paymentMethod: true,
        status: true,
        paidAt: true,
        createdAt: true,
        targetId: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      type: o.type,
      amount: o.amount,
      method: o.paymentMethod.toLowerCase(),
      status: o.status.toLowerCase(),
      paidAt: o.paidAt,
      createdAt: o.createdAt,
      level: o.targetId,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/** 根据订单号查询订单 */
export const getOrderByNo = async (orderNo: string) => {
  return prisma.order.findUnique({ where: { orderNo } });
};

/** 微信支付回调处理 */
export const handleWechatCallback = async (params: Record<string, string>): Promise<boolean> => {
  const { out_trade_no, transaction_id, total_fee, sign } = params;

  // 验证签名
  if (!verifyWechatSign(params, sign || '')) {
    console.error('[WechatPay] Signature verification failed');
    return false;
  }

  const order = await prisma.order.findUnique({ where: { orderNo: out_trade_no } });
  if (!order) {
    console.error('[WechatPay] Order not found:', out_trade_no);
    return false;
  }

  if (order.status !== 'PENDING') {
    console.log('[WechatPay] Order already processed:', out_trade_no);
    return true;
  }

  // 更新订单状态
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      metadata: {
        ...((order.metadata as object) || {}),
        wechatTransactionId: transaction_id,
      },
    },
  });

  // 处理后续业务（增加余额或开通会员）
  await processOrderFulfillment(order);

  return true;
};

/** 支付宝回调处理 */
export const handleAlipayCallback = async (params: Record<string, string>): Promise<boolean> => {
  const { out_trade_no, trade_no, total_amount, sign, trade_status } = params;

  // 验证签名
  if (!verifyAlipaySign(params, sign || '')) {
    console.error('[Alipay] Signature verification failed');
    return false;
  }

  // 只处理交易成功的状态
  if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
    console.error('[Alipay] Trade not success:', trade_status);
    return false;
  }

  const order = await prisma.order.findUnique({ where: { orderNo: out_trade_no } });
  if (!order) {
    console.error('[Alipay] Order not found:', out_trade_no);
    return false;
  }

  if (order.status !== 'PENDING') {
    console.log('[Alipay] Order already processed:', out_trade_no);
    return true;
  }

  // 更新订单状态
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      metadata: {
        ...((order.metadata as object) || {}),
        alipayTradeNo: trade_no,
      },
    },
  });

  // 处理后续业务
  await processOrderFulfillment(order);

  return true;
};

/** 处理订单完成后的事项：增加余额或开通会员 */
const processOrderFulfillment = async (order: Awaited<ReturnType<typeof prisma.order.findUnique>>>) => {
  if (!order) return;

  if (order.type === 'recharge') {
    // 增加用户余额
    const creditAmount = order.amount * 10; // 1元 = 10积分
    await prisma.membership.update({
      where: { userId: order.userId },
      data: {
        credits: { increment: creditAmount },
        totalCredits: { increment: creditAmount },
      },
    });
  } else if (order.type === 'membership') {
    // 开通/续期会员
    const level = order.targetId as MembershipLevel;
    const membershipConfig = MEMBERSHIP_PRICES[level];
    if (!membershipConfig) return;

    const now = new Date();
    const membership = await prisma.membership.findUnique({ where: { userId: order.userId } });

    let expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + membershipConfig.durationDays);

    // 如果已有会员且未过期，叠加时间
    if (membership?.expiresAt && membership.expiresAt > now) {
      const currentExpiry = new Date(membership.expiresAt);
      currentExpiry.setDate(currentExpiry.getDate() + membershipConfig.durationDays);
      expiresAt = currentExpiry;
    }

    await prisma.membership.upsert({
      where: { userId: order.userId },
      create: {
        userId: order.userId,
        tier: 'BASIC',
        credits: membershipConfig.dailyQuota,
        totalCredits: membershipConfig.dailyQuota,
        expiresAt,
      },
      update: {
        tier: 'BASIC',
        credits: membershipConfig.dailyQuota,
        totalCredits: membershipConfig.dailyQuota,
        expiresAt,
      },
    });
  } else if (order.type === 'points') {
    // 增加积分
    const pointsAmount = order.amount * 10;
    await prisma.membership.update({
      where: { userId: order.userId },
      data: {
        credits: { increment: pointsAmount },
        totalCredits: { increment: pointsAmount },
      },
    });
  }
};

/** 标记过期订单 */
export const expireOrders = async () => {
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() - PAYMENT_CONFIG.order.expireMinutes);

  await prisma.order.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expireTime },
    },
    data: {
      status: 'EXPIRED',
    },
  });
};
