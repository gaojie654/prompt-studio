import dotenv from 'dotenv';
dotenv.config();

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    dir: process.env.UPLOAD_DIR || './uploads',
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@promptstudio.com',
  },

  bull: {
    redisUrl: process.env.BULL_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  wanx: {
    apiKey: process.env.WANX_API_KEY,
    baseUrl: process.env.WANX_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: 'wan2.6-image',
    timeout: parseInt(process.env.WANX_TIMEOUT || '120000', 10), // 120s timeout for image generation
    retryAttempts: parseInt(process.env.WANX_RETRY_ATTEMPTS || '2', 10),
  },

  wechat: {
    mchId: process.env.WECHAT_MCHID,
    serialNo: process.env.WECHAT_SERIAL_NO,
    privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH,
    apiv3Key: process.env.WECHAT_APIV3_KEY,
    appId: process.env.WECHAT_APPID,
  },

  alipay: {
    appId: process.env.ALIPAY_APPID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    alipayPublicKey: process.env.ALIPAY_ALIPUBLIC_KEY,
    sandbox: process.env.ALIPAY_SANDBOX !== 'false',
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    oss: {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      endpoint: process.env.OSS_ENDPOINT,
    },
    local: {
      basePath: process.env.LOCAL_STORAGE_PATH || './uploads/images',
      baseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/uploads/images',
    },
  },
};
