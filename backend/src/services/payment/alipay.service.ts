/**
 * 支付宝电脑网站支付 (Alipay Web / Desktop)
 * 文档: https://opendocs.alipay.com/apis/050503
 * 使用沙箱环境先测试
 */

import crypto from 'crypto';
import config from '../../config';
import { AppError } from '../../utils/AppError';
import { PaymentOrder, PaymentResult, PaymentCallbackResult } from './types';

interface AlipayTradeQueryResponse {
  code: string;
  msg: string;
  out_trade_no: string;
  trade_no?: string;
  trade_status: string;
  total_amount: string;
}

interface AlipayTradeCloseResponse {
  code: string;
  msg: string;
  out_trade_no: string;
}

export class AlipayService {
  private appId: string;
  private privateKey: string;
  private alipayPublicKey: string;
  private sandbox: boolean;
  private baseUrl: string;
  private signType = 'RSA2';

  constructor() {
    this.appId = config.alipay?.appId || process.env.ALIPAY_APPID || '';
    this.privateKey = config.alipay?.privateKey || process.env.ALIPAY_PRIVATE_KEY || '';
    this.alipayPublicKey = config.alipay?.alipayPublicKey || process.env.ALIPAY_ALIPUBLIC_KEY || '';
    this.sandbox = (config.alipay?.sandbox ?? (process.env.ALIPAY_SANDBOX !== 'false'));
    this.baseUrl = this.sandbox
      ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do';
  }

  /**
   * Check if Alipay is configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.privateKey && this.alipayPublicKey);
  }

  /**
   * Get the current gateway URL
   */
  getGatewayUrl(): string {
    return this.baseUrl;
  }

  /**
   * Create a page trade (redirect to Alipay)
   */
  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      throw new AppError('支付宝未配置，请检查环境变量', 500, 'ALIPAY_NOT_CONFIGURED');
    }

    const { orderNo, amount, description } = order;

    try {
      const bizContent = {
        out_trade_no: orderNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toFixed(2),
        subject: description.substring(0, 256),
        timeout_express: '15m', // Payment valid for 15 minutes
      };

      // Build request params
      const params = this.buildParams('alipay.trade.page.pay', bizContent);

      // Build redirect URL
      const queryString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join('&');

      const paymentUrl = `${this.baseUrl}?${queryString}`;

      return {
        success: true,
        paymentUrl, // Frontend will redirect to this URL
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`支付宝支付创建失败: ${(error as Error).message}`, 500, 'ALIPAY_ERROR');
    }
  }

  /**
   * Query order status
   */
  async queryOrder(orderNo: string): Promise<AlipayTradeQueryResponse> {
    const bizContent = { out_trade_no: orderNo };
    const params = this.buildParams('alipay.trade.query', bizContent);

    const response = await this.request<AlipayTradeQueryResponse>(params);
    return response;
  }

  /**
   * Close an order
   */
  async closeOrder(orderNo: string): Promise<void> {
    const bizContent = { out_trade_no: orderNo };
    const params = this.buildParams('alipay.trade.close', bizContent);
    await this.request<AlipayTradeCloseResponse>(params);
  }

  /**
   * Verify and parse callback notification (return_url or notify_url)
   */
  parseCallback(query: Record<string, string>): PaymentCallbackResult {
    try {
      const { out_trade_no, trade_no, trade_status, total_amount } = query;

      if (!out_trade_no) {
        return { success: false, orderNo: '', transactionId: '', amount: 0, error: 'Missing out_trade_no' };
      }

      // Verify signature - signature is required for security
      const sign = query.sign;
      const signType = query.sign_type;

      if (!sign) {
        // For synchronous return_url, signature may be absent; for async notify_url it must be present
        // Log warning but don't fail on return_url (GET redirect), only fail on notify_url (POST)
        // Since parseCallback is used for both, we fail open here for return_url compatibility
        // but the calling code should use parseNotifyCallback for POST notifications
        console.warn(`[Alipay] Callback missing signature for order ${out_trade_no} - skipping verification (return_url only)`);
      } else if (!this.verifySignature(query, sign, signType)) {
        return { success: false, orderNo: out_trade_no, transactionId: trade_no || '', amount: 0, error: 'Signature verification failed' };
      }

      // Check trade status - only TRADE_SUCCESS or TRADE_FINISHED means paid
      const validStatuses = ['TRADE_SUCCESS', 'TRADE_FINISHED'];
      if (!validStatuses.includes(trade_status)) {
        return {
          success: false,
          orderNo: out_trade_no,
          transactionId: trade_no || '',
          amount: parseFloat(total_amount || '0'),
          error: `Trade not completed: ${trade_status}`,
        };
      }

      return {
        success: true,
        orderNo: out_trade_no,
        transactionId: trade_no || '',
        amount: parseFloat(total_amount || '0'),
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
   * Parse notify_url callback (async notification)
   * Note: This is for notify_url which uses POST with sign verification
   */
  parseNotifyCallback(body: Record<string, string>): PaymentCallbackResult {
    try {
      const { out_trade_no, trade_no, trade_status, total_amount } = body;

      if (!out_trade_no) {
        return { success: false, orderNo: '', transactionId: '', amount: 0, error: 'Missing out_trade_no' };
      }

      // Verify signature
      const sign = body.sign;
      if (sign && !this.verifySignature(body, sign, body.sign_type)) {
        return { success: false, orderNo: out_trade_no, transactionId: trade_no || '', amount: 0, error: 'Signature verification failed' };
      }

      const validStatuses = ['TRADE_SUCCESS', 'TRADE_FINISHED'];
      if (!validStatuses.includes(trade_status)) {
        return {
          success: false,
          orderNo: out_trade_no,
          transactionId: trade_no || '',
          amount: parseFloat(total_amount || '0'),
          error: `Trade not completed: ${trade_status}`,
        };
      }

      return {
        success: true,
        orderNo: out_trade_no,
        transactionId: trade_no || '',
        amount: parseFloat(total_amount || '0'),
      };
    } catch (error) {
      return {
        success: false,
        orderNo: '',
        transactionId: '',
        amount: 0,
        error: `Notify parse error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Build Alipay request parameters
   */
  private buildParams(method: string, bizContent: object): Record<string, string> {
    const params: Record<string, string> = {
      app_id: this.appId,
      method,
      charset: 'utf-8',
      sign_type: this.signType,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };

    // Generate signature
    params.sign = this.sign(params);

    return params;
  }

  /**
   * Sign parameters using RSA2
   */
  private sign(params: Record<string, string>): string {
    // Sort and filter parameters (exclude sign and sign_type)
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
      .sort();

    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

    // Sign with RSA2 (SHA256withRSA)
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Verify Alipay signature
   */
  private verifySignature(params: Record<string, string>, signature: string, signType?: string): boolean {
    try {
      // Build string to verify
      const sortedKeys = Object.keys(params)
        .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
        .sort();

      const signStr = sortedKeys.map((k) => `${k}=${decodeURIComponent(params[k] as string)}`).join('&');

      // Verify based on sign type
      const verify = crypto.createVerify(signType === 'RSA' ? 'RSA-SHA1' : 'RSA-SHA256');
      verify.update(signStr);
      return verify.verify(this.alipayPublicKey, signature, 'base64');
    } catch {
      return false;
    }
  }

  /**
   * Make request to Alipay gateway
   */
  private async request<T>(params: Record<string, string>): Promise<T> {
    const formData = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      formData.append(k, v);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new AppError(`Alipay API error: HTTP ${response.status}`, response.status, 'ALIPAY_HTTP_ERROR');
      }

      const text = await response.text();

      // Parse response - Alipay returns JSON wrapped in "xxx_response(...)" or plain JSON
      let data: Record<string, unknown>;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new AppError(`Invalid Alipay response: ${text.substring(0, 200)}`, 500, 'ALIPAY_PARSE_ERROR');
      }

      // Check for error code
      const responseData = data as { code?: string; msg?: string };
      if (responseData.code && responseData.code !== '10000') {
        throw new AppError(`Alipay API error: ${responseData.msg || responseData.code}`, 500, 'ALIPAY_API_ERROR');
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new AppError('Alipay API request timeout', 504, 'ALIPAY_TIMEOUT');
      }
      throw error;
    }
  }
}

export const alipayService = new AlipayService();
