// Shared payment types and interfaces

export interface PaymentOrder {
  orderId: string;
  orderNo: string;
  amount: number;        // in yuan (RMB)
  description: string;
  userId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;   // For redirect-based payment (Alipay)
  codeUrl?: string;      // For QR code payment (WeChat Native)
  qrCode?: string;       // Base64 QR code image data URL
  error?: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  orderNo: string;
  transactionId: string;
  amount: number;
  error?: string;
}

// Order product types for frontend
export const RECHARGE_PACKAGES = [
  { id: 'credits_100', credits: 100, price: 10, label: '100积分', description: '适合尝鲜' },
  { id: 'credits_500', credits: 500, price: 45, label: '500积分', description: '最受欢迎', popular: true },
  { id: 'credits_1000', credits: 1000, price: 80, label: '1000积分', description: '超值优惠' },
  { id: 'credits_5000', credits: 5000, price: 350, label: '5000积分', description: '大额套餐' },
] as const;

export const MEMBERSHIP_CARDS = [
  { id: 'monthly', type: 'month', durationDays: 30, price: 29.9, label: '月卡', description: '每月29.9元', benefits: ['每日500积分', '优先队列', '专属客服'] },
  { id: 'yearly', type: 'year', durationDays: 365, price: 299, label: '年卡', description: '每年299元', popular: true, benefits: ['每日1000积分', '优先队列', '专属客服', '8折优惠'] },
] as const;

export type RechargePackageId = typeof RECHARGE_PACKAGES[number]['id'];
export type MembershipCardId = typeof MEMBERSHIP_CARDS[number]['id'];
