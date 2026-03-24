import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createOrder,
  listOrders,
  handleWechatCallback,
  handleAlipayCallback,
} from '../services/payment.service';
import { AppError, asyncHandler } from '../utils/AppError';
import { RECHARGE_OPTIONS } from '../config/membership';

/** POST /api/v1/orders — 创建订单 */
export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const schema = z.object({
    type: z.enum(['recharge', 'membership', 'points']),
    amount: z.number().positive(),
    method: z.enum(['wechat', 'alipay']),
    level: z.enum(['monthly', 'yearly']).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Invalid request body', 400, 'VALIDATION_ERROR');
  }

  const { type, amount, method, level } = parsed.data;

  // recharge 金额必须是预设选项
  if (type === 'recharge' && !RECHARGE_OPTIONS.includes(amount)) {
    throw new AppError(`Recharge amount must be one of: ${RECHARGE_OPTIONS.join(', ')}`, 400, 'INVALID_AMOUNT');
  }

  // membership 必须指定 level
  if (type === 'membership' && !level) {
    throw new AppError('Membership purchase requires level (monthly|yearly)', 400, 'MISSING_LEVEL');
  }

  const result = await createOrder({ userId, type, amount, method, level });

  res.status(201).json({
    code: 0,
    message: 'success',
    data: result,
  });
});

/** GET /api/v1/orders — 查询订单列表 */
export const listOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  if (isNaN(page) || page < 1) throw new AppError('Invalid page', 400, 'INVALID_PAGE');
  if (isNaN(limit) || limit < 1 || limit > 100) throw new AppError('Invalid limit', 400, 'INVALID_LIMIT');

  const result = await listOrders(userId, page, limit);

  res.json({
    code: 0,
    message: 'success',
    data: result,
  });
});

/** POST /api/v1/pay/wechat/callback — 微信支付回调 */
export const wechatCallbackHandler = asyncHandler(async (req: Request, res: Response) => {
  // 微信回调可能有两种格式：XML 或 JSON
  // 这里假设已经过 body-parser 解析为对象
  const params = req.body as Record<string, string>;

  // 如果是 XML 格式的回调，需要额外处理（这里假设使用 JSON）
  // 实际生产环境可能需要使用 xml2js 等库解析

  const success = await handleWechatCallback(params);

  if (success) {
    res.type('application/json').send({ code: 'SUCCESS', message: 'OK' });
  } else {
    res.status(400).send({ code: 'FAIL', message: 'Signature verification failed' });
  }
});

/** POST /api/v1/pay/alipay/callback — 支付宝回调 */
export const alipayCallbackHandler = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body as Record<string, string>;

  const success = await handleAlipayCallback(params);

  if (success) {
    res.send('success');
  } else {
    res.status(400).send('fail');
  }
});
