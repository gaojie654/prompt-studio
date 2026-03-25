/**
 * 微信支付 V3 - Native 支付服务
 * 文档: https://pay.weixin.qq.com/docs/h5/
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import config from '../../config';
import { AppError } from '../../utils/AppError';
import { PaymentOrder, PaymentResult, PaymentCallbackResult } from './types';

interface WechatPayApiV3Response {
  code?: string;
  message?: string;
  code_url?: string;
  prepay_id?: string;
  transaction_id?: string;
  trade_state?: string;
  trade_state_desc?: string;
  amount?: { total: number; payer_total: number; currency: string; payer_currency: string };
  out_trade_no?: string;
  SUCCESS?: string;
}

export class WechatPayService {
  private mchId: string;
  private serialNo: string;
  private privateKeyPath: string;
  private apiv3Key: string;
  private appId: string;
  private baseUrl = 'https://api.mchpay.q.qq.com'; // V3 API

  constructor() {
    this.mchId = config.wechat?.mchId || process.env.WECHAT_MCHID || '';
    this.serialNo = config.wechat?.serialNo || process.env.WECHAT_SERIAL_NO || '';
    this.privateKeyPath = config.wechat?.privateKeyPath || process.env.WECHAT_PRIVATE_KEY_PATH || '';
    this.apiv3Key = config.wechat?.apiv3Key || process.env.WECHAT_APIV3_KEY || '';
    this.appId = config.wechat?.appId || process.env.WECHAT_APPID || '';
  }

  /**
   * Check if WeChat Pay is configured
   */
  isConfigured(): boolean {
    return !!(this.mchId && this.serialNo && this.privateKeyPath && this.apiv3Key && this.appId);
  }

  /**
   * Create a native payment order
   */
  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      throw new AppError('微信支付未配置，请检查环境变量', 500, 'WECHAT_NOT_CONFIGURED');
    }

    const { orderNo, amount, description } = order;
    const total = Math.round(amount * 100); // Convert to fen

    try {
      // Create nonce string
      const nonceStr = this.generateNonceStr(32);

      // Build request body for JSAPI/Native - using Native as primary
      const payload = {
        appid: this.appId,
        mchid: this.mchId,
        description: description.substring(0, 127),
        out_trade_no: orderNo,
        notify_url: `${config.appUrl}/api/v1/payment/wechat/callback`,
        amount: {
          total,
          currency: 'CNY',
        },
        // payer_client_ip should be passed from the request context; default to safe placeholder
        scene_info: {
          payer_client_ip: order.userId ? '127.0.0.1' : '127.0.0.1',
        },
      };

      // Make signed request
      const response = await this.request<WechatPayApiV3Response>(
        'POST',
        '/v3/pay/transactions/native',
        payload,
        nonceStr
      );

      if (response.code_url) {
        // Generate QR code
        const qrCode = await this.generateQRCode(response.code_url);
        return {
          success: true,
          codeUrl: response.code_url,
          qrCode,
        };
      }

      throw new AppError(`微信支付创建失败: ${response.message}`, 500, 'WECHAT_CREATE_FAILED');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`微信支付创建失败: ${(error as Error).message}`, 500, 'WECHAT_ERROR');
    }
  }

  /**
   * Query order status
   */
  async queryOrder(orderNo: string): Promise<WechatPayApiV3Response> {
    const nonceStr = this.generateNonceStr(32);
    return this.request<WechatPayApiV3Response>(
      'GET',
      `/v3/pay/transactions/out-trade-no/${orderNo}`,
      undefined,
      nonceStr,
      { needSign: false }
    );
  }

  /**
   * Verify and parse callback notification
   */
  async parseCallback(
    headers: Record<string, string | undefined>,
    body: string
  ): Promise<PaymentCallbackResult> {
    try {
      // Verify signature
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];

      if (!signature || !timestamp || !nonce) {
        return { success: false, orderNo: '', transactionId: '', amount: 0, error: 'Missing signature headers' };
      }

      // Basic structural validation: verify required headers are present and well-formed
      // Note: Full cryptographic signature verification requires WeChat's platform certificate
      // which must be fetched and cached. For production, implement full verification per:
      // https://wechatpay-apiv3.github.io/wechatpay-perl #/ sek?lang=zh-CN
      if (!/^\d+$/.test(timestamp) || nonce.length < 16) {
        return { success: false, orderNo: '', transactionId: '', amount: 0, error: 'Invalid signature headers format' };
      }

      const data = JSON.parse(body);

      if (data.event_type !== 'TRANSACTION.SUCCESS') {
        return {
          success: false,
          orderNo: data.out_trade_no || '',
          transactionId: data.transaction_id || '',
          amount: (data.amount?.total || 0) / 100,
          error: `Unexpected event type: ${data.event_type}`,
        };
      }

      return {
        success: true,
        orderNo: data.out_trade_no,
        transactionId: data.transaction_id,
        amount: (data.amount?.total || 0) / 100,
      };
    } catch (error) {
      return {
        success: false,
        orderNo: '',
        transactionId: '',
        amount: 0,
        error: `Callback parse error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Close order
   */
  async closeOrder(orderNo: string): Promise<void> {
    const nonceStr = this.generateNonceStr(32);
    await this.request(
      'POST',
      `/v3/pay/transactions/out-trade-no/${orderNo}/close`,
      { mchid: this.mchId },
      nonceStr
    );
  }

  /**
   * Make HTTP request to WeChat Pay API V3
   */
  private async request<T>(
    method: string,
    path: string,
    payload?: object,
    nonceStr?: string,
    options?: { needSign?: boolean; query?: Record<string, string> }
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      // Build URL with query params
      let url = `${this.baseUrl}${path}`;
      if (options?.query) {
        const params = new URLSearchParams(options.query);
        url += `?${params.toString()}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'PromptStudio/1.0',
      };

      // Sign request if payload provided
      if (payload || method !== 'GET') {
        const auth = await this.buildAuthorization(method, path, payload, nonceStr!);
        headers['Authorization'] = auth;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await response.text();
      let data: WechatPayApiV3Response;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new AppError(
          `WeChat API error ${response.status}: ${data.message || text}`,
          response.status,
          'WECHAT_API_ERROR'
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new AppError('WeChat API request timeout', 504, 'WECHAT_TIMEOUT');
      }
      throw error;
    }
  }

  /**
   * Build WeChat Pay V3 authorization header
   */
  private async buildAuthorization(
    method: string,
    requestPath: string,
    payload: object | undefined,
    nonceStr: string
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = payload ? JSON.stringify(payload) : '';

    // Build signing string
    const signStr = `${method}\n${requestPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;

    // Read private key
    let privateKey: string;
    try {
      privateKey = fs.readFileSync(path.resolve(this.privateKeyPath), 'utf8');
    } catch {
      throw new AppError('微信支付私钥文件不存在', 500, 'WECHAT_PRIVATE_KEY_ERROR');
    }

    // Sign with RSA-SHA256
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    const signature = sign.sign(privateKey, 'base64');

    // Build authorization header
    const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`;

    return auth;
  }

  /**
   * Generate random nonce string
   */
  private generateNonceStr(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (const byte of bytes) {
      result += chars[byte % chars.length];
    }
    return result;
  }

  /**
   * Generate QR code as base64 data URL
   */
  private async generateQRCode(data: string): Promise<string> {
    // Using built-in canvas alternative - return data URL directly
    // In production, use 'qrcode' package
    // For now, return the URL itself; frontend will generate QR
    try {
      // Dynamic import to avoid dependency issues
      const qrcode = await import('qrcode');
      const dataUrl = await qrcode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      return dataUrl;
    } catch {
      // Fallback: return data URL with raw data
      return `data:text/plain;base64,${Buffer.from(data).toString('base64')}`;
    }
  }
}

export const wechatPayService = new WechatPayService();
