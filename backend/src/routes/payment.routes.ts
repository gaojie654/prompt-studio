import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';
import {
  createOrderHandler,
  listOrdersHandler,
  wechatCallbackHandler,
  alipayCallbackHandler,
} from '../controllers/payment.controller';

/** 支付回调路由：/api/v1/pay */
const payRouter = Router();
payRouter.post('/wechat/callback', asyncHandler(wechatCallbackHandler));
payRouter.post('/alipay/callback', asyncHandler(alipayCallbackHandler));

/** 订单路由：/api/v1/orders */
const orderRouter = Router();
orderRouter.get('/', authenticate, asyncHandler(listOrdersHandler));
orderRouter.post('/', authenticate, asyncHandler(createOrderHandler));

export { payRouter, orderRouter };
export default orderRouter;
