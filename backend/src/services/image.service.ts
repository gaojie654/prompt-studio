import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { promptService } from './prompt.service';

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

export interface GenerateImageInput {
  userId: string;
  promptId?: string;
  platform: PlatformSize;
  imageUrl?: string; // Reference image URL
  prompt?: string; // Custom prompt text
  negativePrompt?: string;
}

export class ImageService {
  /**
   * Generate an image using AI
   * Note: This is a mock implementation. Replace with actual AI API calls.
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

    // Mock: In production, this would call the actual AI API
    // For now, we'll simulate the generation
    const mockImageUrl = await this.mockGenerateImage({
      platform,
      sizeSpec,
      promptText,
      imageUrl,
      negativePrompt,
    });

    // Update image record with the generated URL
    const updatedImage = await prisma.image.update({
      where: { id: image.id },
      data: { url: mockImageUrl },
    });

    // Increment prompt use count
    if (promptId) {
      await promptService.incrementUseCount(promptId);
    }

    return updatedImage;
  }

  /**
   * Mock image generation
   * Replace this with actual AI API integration (e.g., Wanx, DALL-E, Stable Diffusion)
   */
  private async mockGenerateImage(params: {
    platform: PlatformSize;
    sizeSpec: { width: number; height: number; name: string };
    promptText: string;
    imageUrl?: string;
    negativePrompt?: string;
  }): Promise<string> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, this would:
    // 1. Upload the reference image to cloud storage if provided
    // 2. Call the AI image generation API
    // 3. Wait for the job to complete
    // 4. Download and store the generated image

    // For now, return a placeholder URL
    return `https://placeholder.com/generated/${params.platform}_${Date.now()}.png`;
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
