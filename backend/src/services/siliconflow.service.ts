import { AppError } from '../utils/AppError';
import config from '../config';

// SiliconFlow API response types
export interface SiliconFlowImageResponse {
  images?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  created?: number;
  model?: string;
}

export interface SiliconFlowGenerateParams {
  promptText: string;
  size?: string; // e.g., "1024*1024", "768*1344", "1344*768"
  negativePrompt?: string;
  imageUrl?: string; // Reference image for img2img — uses Qwen/Qwen-Image-Edit when provided
  modelKey?: string; // Model key to use
}

export class SiliconFlowService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly t2iModel = 'Kwai-Kolors/Kolors';
  private readonly i2iModel = 'Qwen/Qwen-Image-Edit';

  constructor() {
    const { apiKey, baseUrl, model, timeout, retryAttempts } = config.siliconflow;
    this.apiKey = apiKey || '';
    this.baseUrl = baseUrl || 'https://api.siliconflow.cn/v1';
    this.model = model || 'Kwai-Kolors/Kolors';
    this.timeout = timeout || 120000;
    this.retryAttempts = retryAttempts || 2;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate an image using SiliconFlow API
   * - T2I: uses Kwai-Kolors/Kolors (text-to-image)
   * - I2I: uses Qwen/Qwen-Image-Edit (image-to-image)
   * POST https://api.siliconflow.cn/v1/images/generations
   */
  async generateImage(params: SiliconFlowGenerateParams): Promise<string> {
    const { promptText, size, negativePrompt, imageUrl, modelKey } = params;

    if (!this.apiKey) {
      throw new AppError(
        'SiliconFlow API key is not configured. Please set SILICONFLOW_API_KEY in your environment.',
        500,
        'SILICONFLOW_NOT_CONFIGURED'
      );
    }

    // Map modelKey to SiliconFlow model names
    const modelMap: Record<string, string> = {
      'kolors': 'Kwai-Kolors/Kolors',
      'gpt-image-1': 'openai/gpt-image-1',
      'nano-banana': 'google/gemini-2.0-flash-exp-image',
      'nano-banana-pro': 'Pro/google/gemini-2.0-flash-exp-image',
    };

    // Determine which model to use
    let activeModel: string;
    if (modelKey && modelMap[modelKey]) {
      activeModel = modelMap[modelKey];
    } else {
      // Fall back to default logic based on whether reference image is provided
      const isI2I = !!imageUrl;
      activeModel = isI2I ? this.i2iModel : this.t2iModel;
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: activeModel,
      prompt: promptText,
      image_size: this.normalizeSize(size),
      n: 1,
    };

    // Add reference image for img2img
    if (imageUrl) {
      requestBody.image = imageUrl;
    }

    // Add negative prompt if provided
    if (negativePrompt) {
      requestBody.negative_prompt = negativePrompt;
    }

    // Make request with retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const imageUrl = await this.makeRequest(requestBody);
        return imageUrl;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof AppError) {
          if (error.code === 'SILICONFLOW_AUTH_ERROR' || error.code === 'SILICONFLOW_INVALID_PARAMS') {
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new AppError('SiliconFlow API call failed after retries', 500, 'SILICONFLOW_API_ERROR');
  }

  /**
   * Normalize size string to SiliconFlow format
   * Kolors supports: 1024x1024, 768x1344, 1344x768, etc.
   */
  private normalizeSize(size?: string): string {
    if (!size) {
      return '1024*1024'; // Default to square
    }

    // Convert "1280*720" format to "1280x720" if needed
    // SiliconFlow uses "WIDTHxHEIGHT" format
    return size.replace(/\*/g, 'x');
  }

  /**
   * Make HTTP request to SiliconFlow API
   */
  private async makeRequest(requestBody: Record<string, unknown>): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            'SiliconFlow API authentication failed. Please check your API key.',
            401,
            'SILICONFLOW_AUTH_ERROR'
          );
        }
        if (response.status === 400) {
          const errorBody = await response.text();
          throw new AppError(
            `SiliconFlow API invalid request: ${errorBody}`,
            400,
            'SILICONFLOW_INVALID_PARAMS'
          );
        }
        if (response.status === 429) {
          throw new AppError(
            'SiliconFlow API rate limit exceeded. Please try again later.',
            429,
            'SILICONFLOW_RATE_LIMIT'
          );
        }
        // For 500+ errors, capture the response body to help debug
        const errorBody = await response.text().catch(() => '(no body)');
        throw new AppError(
          `SiliconFlow API error: HTTP ${response.status} — ${errorBody.substring(0, 300)}`,
          response.status,
          'SILICONFLOW_HTTP_ERROR'
        );
      }

      const data = await response.json() as SiliconFlowImageResponse;

      // Parse response - SiliconFlow returns { images: [{ url: string }] }
      if (!data.images || data.images.length === 0) {
        throw new AppError(
          'Invalid response from SiliconFlow API: no images returned',
          500,
          'SILICONFLOW_INVALID_RESPONSE'
        );
      }

      const imageResult = data.images[0];

      // Prefer URL over base64
      if (imageResult.url) {
        return imageResult.url;
      }

      throw new AppError(
        'No image URL in SiliconFlow API response',
        500,
        'SILICONFLOW_NO_IMAGE'
      );
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AppError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new AppError(
          'SiliconFlow API request timed out',
          504,
          'SILICONFLOW_TIMEOUT'
        );
      }

      throw new AppError(
        `SiliconFlow API request failed: ${(error as Error).message}`,
        500,
        'SILICONFLOW_REQUEST_FAILED'
      );
    }
  }
}

export const siliconflowService = new SiliconFlowService();
