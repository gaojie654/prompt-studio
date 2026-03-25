/**
 * 支付回调路由 (v1)
 * 处理微信支付和支付宝的异步通知
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/AppError';
import { wechatPayService } from '../../services/payment/wechat.service';
import { alipayService } from '../../services/payment/alipay.service';
import { paymentOrderService } from '../../services/payment/order.service';
import { balanceService } from '../../services/payment/balance.service';
import prisma from '../../utils/prisma';
import { OrderType } from '@prisma/client';

const router = Router();

// ============================================================
// 微信支付回调
// ============================================================
router.post(
  '/wechat/callback',
  asyncHandler(async (req: Request, res: Response) => {
    // WeChat Pay sends JSON body
    const body = JSON.stringify(req.body);
    const headers = {
      'wechatpay-signature': req.headers['wechatpay-signature'] as string,
      'wechatpay-timestamp': req.headers['wechatpay-timestamp'] as string,
      'wechatpay-nonce': req.headers['wechatpay-nonce'] as string,
      'wechatpay-serial': req.headers['wechatpay-serial'] as string,
    };

    const result = await wechatPayService.parseCallback(headers, body);

    if (result.success) {
      // Process the payment
      await processPaymentSuccess(result.orderNo, result.transactionId, result.amount);
      // Return success acknowledgment to WeChat
      res.status(200).json({ code: 'SUCCESS', message: '成功' });
    } else {
      res.status(400).json({ code: 'FAIL', message: result.error });
    }
  })
);

// ============================================================
// 支付宝回调 (notify_url - 异步通知)
// ============================================================
router.post(
  '/alipay/notify',
  asyncHandler(async (req: Request, res: Response) => {
    const result = alipayService.parseNotifyCallback(req.body as Record<string, string>);

    if (result.success) {
      await processPaymentSuccess(result.orderNo, result.transactionId, result.amount);
      // Return "success" to Alipay (Alipay expects "success" string)
      res.send('success');
    } else {
      res.send('fail');
    }
  })
);

// ============================================================
// 支付宝跳转回调 (return_url - 同步跳转)
// This endpoint handles the redirect after payment on Alipay's page
// ============================================================
router.get(
  '/alipay/return',
  asyncHandler(async (req: Request, res: Response) => {
    const result = alipayService.parseCallback(req.query as Record<string, string>);

    if (result.success) {
      // Update order status (may have already been updated by notify)
      await processPaymentSuccess(result.orderNo, result.transactionId, result.amount);
      // Redirect to frontend success page
      res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payment/success?orderNo=${result.orderNo}`);
    } else {
      res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payment/failed?orderNo=${req.query.out_trade_no}`);
    }
  })
);

// ============================================================
// 处理支付成功逻辑
// ============================================================
async function processPaymentSuccess(orderNo: string, transactionId: string, amount: number) {
  // Find order
  const order = await prisma.order.findUnique({
    where: { orderNo },
  });

  if (!order) {
    console.error(`[Payment] Order not found: ${orderNo}`);
    return;
  }

  // Skip if already paid (idempotent)
  if (order.status === 'PAID') {
    return;
  }

  // Mark order as paid
  await paymentOrderService.markPaid(orderNo, transactionId);

  // Process based on order type
  if (order.type === OrderType.TOPUP) {
    const metadata = order.metadata as { credits?: number } | null;
    const credits = metadata?.credits || 0;
    await balanceService.rechargeCredits({
      userId: order.userId,
      credits,
      orderId: order.id,
      amount,
    });
  } else if (order.type === OrderType.MEMBERSHIP) {
    const metadata = order.metadata as { cardType?: string } | null;
    const cardType = metadata?.cardType === 'year' ? 'year' : 'month';
    await balanceService.purchaseMembership({
      userId: order.userId,
      cardType,
      orderId: order.id,
      amount,
    });
  }

  // Log success internally (no sensitive data exposed to client)
  console.info(`[Payment] Processed: ${orderNo}`);
}

export default router;
