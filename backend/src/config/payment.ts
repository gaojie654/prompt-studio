export const PAYMENT_CONFIG = {
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    callbackUrl: process.env.WECHAT_CALLBACK_URL || '',
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    callbackUrl: process.env.ALIPAY_CALLBACK_URL || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  },
  order: {
    expireMinutes: 30,
  },
};
