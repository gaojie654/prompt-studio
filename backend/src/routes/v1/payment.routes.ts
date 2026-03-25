/**
 * 支付路由
 * 创建支付订单、查询支付状态
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/AppError';
import { paymentOrderService, PaymentMethod } from '../../services/payment/order.service';
import { wechatPayService } from '../../services/payment/wechat.service';
import { alipayService } from '../../services/payment/alipay.service';
import { balanceService } from '../../services/payment/balance.service';
import { storageService } from '../../services/storage/image-storage.service';
import { RECHARGE_PACKAGES, MEMBERSHIP_CARDS } from '../../services/payment/types';
import { OrderType } from '@prisma/client';
import prisma from '../../utils/prisma';

const router: Router = Router();

// ============================================================
// 公共接口（无需认证的部分）
// ============================================================

// 获取充值套餐列表
router.get('/packages/recharge', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ packages: RECHARGE_PACKAGES });
}));

// 获取会员卡列表
router.get('/packages/membership', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ cards: MEMBERSHIP_CARDS });
}));

// 获取支付配置状态
router.get('/config', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    wechatEnabled: wechatPayService.isConfigured(),
    alipayEnabled: alipayService.isConfigured(),
    storageType: storageService.getStorageType(),
  });
}));

// ============================================================
// 认证接口
// ============================================================

// 获取用户余额信息
router.get(
  '/balance',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const balance = await balanceService.getBalance(req.user!.userId);
    res.json({ balance });
  })
);

// 获取交易记录
router.get(
  '/transactions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await balanceService.getTransactions(req.user!.userId, page, pageSize);
    res.json(result);
  })
);

// 获取用户订单列表
router.get(
  '/orders',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await paymentOrderService.getUserOrders(req.user!.userId, page, pageSize);
    res.json(result);
  })
);

// 获取单个订单详情
router.get(
  '/orders/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await paymentOrderService.getById(req.params.id as string, req.user!.userId);
    if (!order) {
      return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
    }
    return res.json({ order });
  })
);

// ============================================================
// 创建充值订单// POST /api/v1/payment/recharge
// Body: { packageId: string, paymentMethod: 'WECHAT' | 'ALIPAY' }
// ============================================================
router.post(
  '/recharge',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { packageId, paymentMethod } = req.body as { packageId: string; paymentMethod: string };

    if (!packageId || !paymentMethod) {
      return res.status(400).json({ code: 'MISSING_PARAMS', message: '缺少必要参数' });
    }

    // Create order
    const order = await paymentOrderService.createRechargeOrder(
      req.user!.userId,
      packageId,
      paymentMethod as PaymentMethod
    );

    // Initiate payment based on method
    let paymentResult;
    if (paymentMethod === 'WECHAT') {
      paymentResult = await wechatPayService.createPayment({
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        description: order.description || `充值订单${order.orderNo}`,
        userId: req.user!.userId,
      });
    } else if (paymentMethod === 'ALIPAY') {
      paymentResult = await alipayService.createPayment({
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        description: order.description || `充值订单${order.orderNo}`,
        userId: req.user!.userId,
      });
    } else {
      return res.status(400).json({ code: 'INVALID_METHOD', message: '不支持的支付方式' });
    }

    return res.status(201).json({
      order,
      payment: paymentResult,
    });
  })
);

// ============================================================
// 创建会员购买订单
// POST /api/v1/payment/membership
// Body: { cardId: string, paymentMethod: 'WECHAT' | 'ALIPAY' }
// ============================================================
router.post(
  '/membership',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId, paymentMethod } = req.body as { cardId: string; paymentMethod: string };

    if (!cardId || !paymentMethod) {
      return res.status(400).json({ code: 'MISSING_PARAMS', message: '缺少必要参数' });
    }

    // Create order
    const order = await paymentOrderService.createMembershipOrder(
      req.user!.userId,
      cardId,
      paymentMethod as PaymentMethod
    );

    // Initiate payment
    let paymentResult;
    if (paymentMethod === 'WECHAT') {
      paymentResult = await wechatPayService.createPayment({
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        description: order.description || `会员购买 ${order.orderNo}`,
        userId: req.user!.userId,
      });
    } else if (paymentMethod === 'ALIPAY') {
      paymentResult = await alipayService.createPayment({
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        description: order.description || `会员购买 ${order.orderNo}`,
        userId: req.user!.userId,
      });
    } else {
      return res.status(400).json({ code: 'INVALID_METHOD', message: '不支持的支付方式' });
    }

    return res.status(201).json({
      order,
      payment: paymentResult,
    });
  })
);

// ============================================================
// 取消订单
// POST /api/v1/payment/orders/:id/cancel
// ============================================================
router.post(
  '/orders/:id/cancel',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await paymentOrderService.getById(req.params.id as string, req.user!.userId);
    if (!order) {
      return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
    }

    await paymentOrderService.cancel(order.orderNo, req.user!.userId);
    return res.json({ message: '订单已取消' });
  })
);

// ============================================================
// 查询微信支付订单状态(用于前端轮询)
// GET /api/v1/payment/wechat/status/:orderNo
// ============================================================
router.get(
  '/wechat/status/:orderNo',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const orderNo = req.params.orderNo as string;
    const order = await paymentOrderService.getByOrderNo(orderNo);
    if (!order) {
      return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
    }

    if (order.userId !== req.user!.userId) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '无权访问' });
    }

    // If already paid, return directly
    if (order.status === 'PAID') {
      return res.json({ status: 'PAID', order });
    }

    // Query WeChat for status
    try {
      const wechatResult = await wechatPayService.queryOrder(order.orderNo);
      if (wechatResult.trade_state === 'SUCCESS') {
        // Process payment
        await processPayment(orderNo, wechatResult.transaction_id || '');
        return res.json({ status: 'PAID', order: await paymentOrderService.getByOrderNo(order.orderNo) });
      }
      return res.json({ status: wechatResult.trade_state || 'PENDING', order });
    } catch {
      return res.json({ status: 'PENDING', order });
    }
  })
);

// ============================================================
// 查询支付宝订单状态// GET /api/v1/payment/alipay/status/:orderNo
// ============================================================
router.get(
  '/alipay/status/:orderNo',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const orderNo = req.params.orderNo as string;
    const order = await paymentOrderService.getByOrderNo(orderNo);
    if (!order) {
      return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
    }

    if (order.userId !== req.user!.userId) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '无权访问' });
    }

    if (order.status === 'PAID') {
      return res.json({ status: 'PAID', order });
    }

    try {
      const alipayResult = await alipayService.queryOrder(order.orderNo);
      const validStatuses = ['TRADE_SUCCESS', 'TRADE_FINISHED'];
      if (validStatuses.includes(alipayResult.trade_status)) {
        await processPayment(order.orderNo, alipayResult.trade_no || '');
        return res.json({ status: 'PAID', order: await paymentOrderService.getByOrderNo(order.orderNo) });
      }
      return res.json({ status: alipayResult.trade_status || 'PENDING', order });
    } catch {
      return res.json({ status: 'PENDING', order });
    }
  })
);

// ============================================================
// Helper: process payment success
// ============================================================
async function processPayment(orderNo: string, transactionId: string) {
  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order || order.status === 'PAID') return;

  await paymentOrderService.markPaid(orderNo, transactionId);

  if (order.type === OrderType.TOPUP) {
    const metadata = order.metadata as { credits?: number } | null;
    await balanceService.rechargeCredits({
      userId: order.userId,
      credits: metadata?.credits || 0,
      orderId: order.id,
      amount: order.amount,
    });
  } else if (order.type === OrderType.MEMBERSHIP) {
    const metadata = order.metadata as { cardType?: string } | null;
    await balanceService.purchaseMembership({
      userId: order.userId,
      cardType: metadata?.cardType === 'year' ? 'year' : 'month',
      orderId: order.id,
      amount: order.amount,
    });
  }
}

export default router;
