/**
 * 支付订单服务
 * 负责创建支付订单、查询订单状态
 */

import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { PaymentMethod, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { RECHARGE_PACKAGES, MEMBERSHIP_CARDS } from './types';
import crypto from 'crypto';

export type { PaymentMethod, OrderStatus, OrderType };

export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  paymentMethod: PaymentMethod;
  productId?: string; // recharge package id or membership card id
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface OrderInfo {
  id: string;
  orderNo: string;
  userId: string;
  type: OrderType;
  amount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export class PaymentOrderService {
  /**
   * 生成唯一订单号
   * 格式: PS + 时间戳 + 随机数
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `PS${timestamp}${random}`;
  }

  /**
   * 创建充值订单
   */
  async createRechargeOrder(userId: string, packageId: string, paymentMethod: PaymentMethod): Promise<OrderInfo> {
    // Find package
    const pkg = RECHARGE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw new AppError('无效的充值套餐', 400, 'INVALID_PACKAGE');
    }

    if (paymentMethod !== 'WECHAT' && paymentMethod !== 'ALIPAY' && paymentMethod !== 'POINTS') {
      throw new AppError('不支持的支付方式', 400, 'INVALID_PAYMENT_METHOD');
    }

    const orderNo = this.generateOrderNo();

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId,
        type: OrderType.TOPUP,
        amount: pkg.price,
        paymentMethod,
        status: OrderStatus.PENDING,
        description: `充值${pkg.label}`,
        metadata: {
          credits: pkg.credits,
          packageId: pkg.id,
          label: pkg.label,
        },
      },
    });

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      type: order.type,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 创建会员购买订单
   */
  async createMembershipOrder(userId: string, cardId: string, paymentMethod: PaymentMethod): Promise<OrderInfo> {
    const card = MEMBERSHIP_CARDS.find((c) => c.id === cardId);
    if (!card) {
      throw new AppError('无效的会员卡', 400, 'INVALID_CARD');
    }

    const orderNo = this.generateOrderNo();

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId,
        type: OrderType.MEMBERSHIP,
        amount: card.price,
        paymentMethod,
        status: OrderStatus.PENDING,
        description: `购买${card.label}`,
        metadata: {
          cardType: card.type,
          durationDays: card.durationDays,
          cardId: card.id,
          label: card.label,
        },
      },
    });

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      type: order.type,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 创建普通订单（提示词/图片购买等）
   */
  async createOrder(input: CreateOrderInput): Promise<OrderInfo> {
    const orderNo = this.generateOrderNo();

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        status: OrderStatus.PENDING,
        description: input.description,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      type: order.type,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 根据订单号查询订单
   */
  async getByOrderNo(orderNo: string): Promise<OrderInfo | null> {
    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      type: order.type,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 根据订单ID查询订单
   */
  async getById(id: string, userId?: string): Promise<OrderInfo | null> {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) return null;
    if (userId && order.userId !== userId) {
      throw new AppError('无权访问此订单', 403, 'FORBIDDEN');
    }

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      type: order.type,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        userId: o.userId,
        type: o.type,
        amount: o.amount,
        paymentMethod: o.paymentMethod,
        status: o.status,
        description: o.description,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 标记订单已支付
   */
  async markPaid(orderNo: string, transactionId: string): Promise<void> {
    await prisma.order.update({
      where: { orderNo },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        metadata: { transactionId },
      },
    });
  }

  /**
   * 标记订单失败
   */
  async markFailed(orderNo: string, reason?: string): Promise<void> {
    await prisma.order.update({
      where: { orderNo },
      data: {
        status: OrderStatus.FAILED,
        metadata: { failureReason: reason },
      },
    });
  }

  /**
   * 取消订单
   */
  async cancel(orderNo: string, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new AppError('无权取消此订单', 403, 'FORBIDDEN');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new AppError('只能取消待支付订单', 400, 'INVALID_STATUS');
    }

    await prisma.order.update({
      where: { orderNo },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}

export const paymentOrderService = new PaymentOrderService();
