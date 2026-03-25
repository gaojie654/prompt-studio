import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { promptService } from './prompt.service';
import { createReview } from './review.service';
import config from '../config';
import { storageService } from './storage/image-storage.service';
import { siliconflowService } from './siliconflow.service';

// Platform size specifications
export const PLATFORM_SIZES = {
  // 小红书
  xiaohongshu_cover_v: { width: 1080, height: 1440, name: '小红书封面(竖)' },
  xiaohongshu_cover_s: { width: 1080, height: 1080, name: '小红书封面(方)' },
  // 抖音
  douyin_cover: { width: 1080, height: 1920, name: '抖音封面(竖)' },
  douyin_post: { width: 1200, height: 627, name: '抖音贴文(横)' },
  // 公众号
  gzh_cover: { width: 900, height: 383, name: '公众号头条封面' },
  gzh_cover_sub: { width: 200, height: 200, name: '公众号次条封面' },
  // 淘宝
  taobao_main: { width: 800, height: 800, name: '淘宝主图' },
  // 拼多多
  pdd_main: { width: 750, height: 352, name: '拼多多主图' },
  // 京东
  jd_main: { width: 800, height: 800, name: '京东主图' },
} as const;

export type PlatformSize = keyof typeof PLATFORM_SIZES;

// Map platform sizes to Wanx size strings
const PLATFORM_SIZE_MAP: Record<PlatformSize, string> = {
  xiaohongshu_cover_v: '720*1280',  // 9:16 vertical
  xiaohongshu_cover_s: '1280*1280', // 1:1 square
  douyin_cover: '720*1280',        // 9:16 vertical
  douyin_post: '1280*720',         // 16:9 horizontal
  gzh_cover: '1200*512',           // approximately 2.35:1
  gzh_cover_sub: '800*800',        // 1:1 square
  taobao_main: '1024*1024',        // 1:1 square
  pdd_main: '1024*480',            // approximately 2.13:1
  jd_main: '1024*1024',            // 1:1 square
};

// Map platform sizes to SiliconFlow/Kolors size strings
// Kolors supports: 1024x1024, 768x1344, 1344x768, 768x1344, 1024x1024, 1440x720, 1920x720, 720x1440
const PLATFORM_SIZE_MAP_SF: Record<PlatformSize, string> = {
  xiaohongshu_cover_v: '768x1344', // 9:16 portrait
  xiaohongshu_cover_s: '1024x1024', // 1:1 square
  douyin_cover: '768x1344',        // 9:16 portrait
  douyin_post: '1344x768',         // 16:9 horizontal
  gzh_cover: '1440x720',           // 2:1 banner
  gzh_cover_sub: '1024x1024',      // 1:1 square
  taobao_main: '1024x1024',        // 1:1 square
  pdd_main: '1440x720',            // 2:1 banner (closest supported)
  jd_main: '1024x1024',            // 1:1 square
};

export interface GenerateImageInput {
  userId: string;
  promptId?: string;
  platform: PlatformSize;
  imageUrl?: string; // Reference image URL
  prompt?: string; // Custom prompt text
  negativePrompt?: string;
}

export interface WanxGenerateParams {
  promptText: string;
  size: string;
  negativePrompt?: string;
  imageUrl?: string;
}

export interface WanxResponse {
  output?: {
    choices?: Array<{
      finish_reason?: string;
      message?: {
        content?: Array<{
          type: string;
          image?: string;
          text?: string;
        }>;
        role?: string;
      };
    }>;
    finished?: boolean;
  };
  usage?: {
    image_count?: number;
    total_tokens?: number;
    size?: string;
  };
  request_id?: string;
}

export class ImageService {
  /**
   * Generate an image using AI (Wanx API)
   */
  async generate(input: GenerateImageInput) {
    const { userId, promptId, platform, imageUrl, prompt: customPrompt, negativePrompt } = input;

    // Get size specs
    const sizeSpec = PLATFORM_SIZES[platform];
    if (!sizeSpec) {
      throw new AppError(`Unknown platform: ${platform}`, 400, 'INVALID_PLATFORM');
    }

    // Check user credits/membership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { membership: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check credits (simplified - in production, check membership and balance)
    const creditsRequired = 1;
    const userCredits = user.membership?.credits || 0;
    if (userCredits < creditsRequired) {
      throw new AppError('Insufficient credits', 402, 'INSUFFICIENT_CREDITS');
    }

    // Get prompt content if promptId provided
    let promptText = customPrompt || '';
    if (promptId) {
      const promptRecord = await promptService.getById(promptId);
      promptText = promptRecord.content;
    }

    if (!promptText) {
      throw new AppError('Prompt is required', 400, 'MISSING_PROMPT');
    }

    // Create image record with pending status
    const image = await prisma.image.create({
      data: {
        userId,
        promptId: promptId || null,
        url: '', // Will be updated when generation completes
        filename: `generated_${platform}_${Date.now()}.png`,
        width: sizeSpec.width,
        height: sizeSpec.height,
      },
    });

    // Deduct credit
    if (user.membership) {
      await prisma.membership.update({
        where: { userId },
        data: { credits: { decrement: creditsRequired } },
      });
    }

    // Get size parameter - prefer SiliconFlow (Kolors) if configured, otherwise use Wanx
    const useSiliconFlow = siliconflowService.isConfigured();
    const size = useSiliconFlow
      ? PLATFORM_SIZE_MAP_SF[platform] || '1024x1024'
      : PLATFORM_SIZE_MAP[platform] || '1280*1280';

    // Call image generation API
    try {
      let imageUrlResult: string;

      if (useSiliconFlow) {
        // Use SiliconFlow Kolors
        imageUrlResult = await siliconflowService.generateImage({
          promptText,
          size,
          negativePrompt,
          imageUrl,
        });
        console.info(`[ImageService] Generated image using SiliconFlow Kolors (${size})`);
      } else {
        // Fall back to Wanx
        imageUrlResult = await this.callWanxApi({
          promptText,
          size,
          negativePrompt,
          imageUrl,
        });
        console.info(`[ImageService] Generated image using Wanx (${size})`);
      }

      // Update image record with the generated URL
      let finalUrl = imageUrlResult;

      // Persist image to local/OSS storage
      try {
        const savedImage = await storageService.downloadImage(imageUrlResult, userId, image.id);
        finalUrl = savedImage.url;
        console.info(`[ImageService] Image persisted: ${savedImage.filename}`);
      } catch (storageError) {
        // Log but don't fail - we still have the original URL (may expire)
        console.error(`[ImageService] Failed to persist image: ${(storageError as Error).message}`);
      }

      const updatedImage = await prisma.image.update({
        where: { id: image.id },
        data: { url: finalUrl },
      });

      // Create review record for the generated image
      await createReview(image.id);

      // Increment prompt use count
      if (promptId) {
        await promptService.incrementUseCount(promptId);
      }

      return updatedImage;
    } catch (error) {
      // Refund credit on failure
      if (user.membership) {
        await prisma.membership.update({
          where: { userId },
          data: { credits: { increment: creditsRequired } },
        });
      }

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Call Wanx API to generate an image
   */
  private async callWanxApi(params: WanxGenerateParams): Promise<string> {
    const { promptText, size, negativePrompt, imageUrl } = params;
    const { apiKey, baseUrl, model, timeout, retryAttempts } = config.wanx;

    if (!apiKey) {
      throw new AppError(
        'Wanx API key is not configured. Please set WANX_API_KEY in your environment.',
        500,
        'WANX_NOT_CONFIGURED'
      );
    }

    // Build request body
    const contentArray: Array<{ text?: string; image?: string }> = [
      { text: promptText },
    ];

    // Add reference image if provided
    if (imageUrl) {
      contentArray.push({ image: imageUrl });
    }

    const requestBody = {
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: contentArray,
          },
        ],
      },
      parameters: {
        size,
        n: 1,
        enable_interleave: !!imageUrl,
        watermark: false,
        prompt_extend: true,
        ...(negativePrompt && { negative_prompt: negativePrompt }),
      },
    };

    // Make request with retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(baseUrl, apiKey, requestBody, timeout);
        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof AppError) {
          // Non-retryable errors
          if (error.code === 'WANX_AUTH_ERROR' || error.code === 'WANX_INVALID_PARAMS') {
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryAttempts) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new AppError('Wanx API call failed after retries', 500, 'WANX_API_ERROR');
  }

  /**
   * Make HTTP request to Wanx API
   */
  private async makeRequest(
    baseUrl: string,
    apiKey: string,
    requestBody: object,
    timeout: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AppError('Wanx API authentication failed. Please check your API key.', 401, 'WANX_AUTH_ERROR');
        }
        if (response.status === 400) {
          const errorBody = await response.text();
          throw new AppError(`Wanx API invalid request: ${errorBody}`, 400, 'WANX_INVALID_PARAMS');
        }
        if (response.status === 429) {
          throw new AppError('Wanx API rate limit exceeded. Please try again later.', 429, 'WANX_RATE_LIMIT');
        }
        throw new AppError(`Wanx API error: HTTP ${response.status}`, response.status, 'WANX_HTTP_ERROR');
      }

      const data = await response.json() as WanxResponse;

      // Parse response
      if (!data.output?.choices?.[0]?.message?.content) {
        throw new AppError('Invalid response from Wanx API', 500, 'WANX_INVALID_RESPONSE');
      }

      const content = data.output.choices[0].message.content;
      const imageContent = content.find((c) => c.type === 'image');

      if (!imageContent?.image) {
        throw new AppError('No image URL in Wanx API response', 500, 'WANX_NO_IMAGE');
      }

      return imageContent.image;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AppError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new AppError('Wanx API request timed out', 504, 'WANX_TIMEOUT');
      }

      throw new AppError(`Wanx API request failed: ${(error as Error).message}`, 500, 'WANX_REQUEST_FAILED');
    }
  }

  /**
   * Get images for a user
   */
  async getUserImages(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.image.count({ where: { userId } }),
    ]);

    return {
      images,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get image by ID
   */
  async getById(id: string, userId?: string) {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
      },
    });

    if (!image) {
      throw new AppError('Image not found', 404, 'NOT_FOUND');
    }

    // If userId provided, ensure the image belongs to the user
    if (userId && image.userId !== userId) {
      throw new AppError('Not authorized to access this image', 403, 'FORBIDDEN');
    }

    return image;
  }

  /**
   * Delete an image
   */
  async delete(id: string, userId: string) {
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new AppError('Image not found', 404, 'NOT_FOUND');
    }

    if (image.userId !== userId) {
      throw new AppError('Not authorized to delete this image', 403, 'FORBIDDEN');
    }

    await prisma.image.delete({
      where: { id },
    });
  }

  /**
   * Get available platform sizes
   */
  getPlatformSizes() {
    return Object.entries(PLATFORM_SIZES).map(([key, value]) => ({
      key,
      ...value,
    }));
  }
}

export const imageService = new ImageService();
