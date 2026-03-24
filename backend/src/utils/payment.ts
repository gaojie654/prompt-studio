import crypto from 'crypto';
import { PAYMENT_CONFIG } from '../config/payment';
import { MEMBERSHIP_PRICES } from '../config/membership';

/** 生成订单号：PS + 年月日时分秒 + 4位随机数 */
export const generateOrderNo = (): string => {
  const now = new Date();
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `PS${datePart}${random}`;
};

/** 计算订单过期时间 */
export const getOrderExpireTime = (): Date => {
  const expireAt = new Date();
  expireAt.setMinutes(expireAt.getMinutes() + PAYMENT_CONFIG.order.expireMinutes);
  return expireAt;
};

/** 微信支付签名验证 */
export const verifyWechatSign = (params: Record<string, string>, sign: string): boolean => {
  const { apiKey } = PAYMENT_CONFIG.wechat;
  if (!apiKey) return false;

  // 构造签名串：按字典序拼接 key=value 并用 & 连接，最后拼接 key
  const signStr = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&') + `&key=${apiKey}`;

  const md5 = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  return md5 === sign;
};

/** 验证微信回调签名（使用 API v3 密钥的 HMAC-SHA256） */
export const verifyWechatCallbackSign = (
  message: string,
  signature: string,
  serialNo: string
): boolean => {
  const apiV3Key = PAYMENT_CONFIG.wechat.apiV3Key;
  if (!apiV3Key) return false;

  const expectedSig = crypto
    .createHmac('sha256', apiV3Key)
    .update(message, 'utf8')
    .digest('base64');

  return expectedSig === signature;
};

/** 支付宝签名验证 */
export const verifyAlipaySign = (
  params: Record<string, string>,
  sign: string
): boolean => {
  const { publicKey } = PAYMENT_CONFIG.alipay;
  if (!publicKey) return false;

  // 支付宝签名：剔除 sign 和 sign_type，按字典序拼接 key=value，用 & 连接
  const signStr = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signStr, 'utf8');
    return verify.verify(publicKey, sign, 'base64');
  } catch {
    return false;
  }
};

/** 计算会员订单金额 */
export const calculateMembershipAmount = (level: 'monthly' | 'yearly'): number => {
  return MEMBERSHIP_PRICES[level].price;
};

/** 计算积分订单金额（元） */
export const calculatePointsAmount = (points: number): number => {
  return points / 10; // 1元 = 10积分
};

/** 微信Native支付下单（模拟，实际需调用微信API） */
export const wechatNativePay = async (
  orderNo: string,
  amount: number,
  description: string,
  expireAt: Date
): Promise<{ qrCode: string; payUrl: string }> => {
  // 实际项目中这里需要调用微信支付API
  // 这里返回模拟数据，生产环境请使用微信官方 SDK 或直接调用 API
  const mockQrCode = `https://api.mch.weixin.qq.com/qrcode/${orderNo}`;
  const mockPayUrl = `weixin://wxpay/bizpayurl?pr=${encodeURIComponent(orderNo)}`;

  console.warn('[Payment] wechatNativePay called — using mock data. Implement real API call in production.');

  return { qrCode: mockQrCode, payUrl: mockPayUrl };
};

/** 支付宝扫码支付（模拟，实际需调用支付宝API） */
export const alipayQrPay = async (
  orderNo: string,
  amount: number,
  subject: string,
  expireAt: Date
): Promise<{ qrCode: string; payUrl: string }> => {
  // 实际项目中这里需要调用支付宝API
  const mockQrCode = `https://api.alipay.com/qrcode/${orderNo}`;
  const mockPayUrl = `https://openapi.alipay.com/gateway.do?out_trade_no=${orderNo}`;

  console.warn('[Payment] alipayQrPay called — using mock data. Implement real API call in production.');

  return { qrCode: mockQrCode, payUrl: mockPayUrl };
};

/** 根据类型和金额获取支付描述 */
export const getPaymentSubject = (type: string, level?: string): string => {
  switch (type) {
    case 'membership':
      return level ? MEMBERSHIP_PRICES[level as keyof typeof MEMBERSHIP_PRICES]?.name || '会员' : '会员购买';
    case 'points':
      return '积分充值';
    case 'recharge':
      return '余额充值';
    default:
      return '支付';
  }
};
