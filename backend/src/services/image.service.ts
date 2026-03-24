import prisma from '../utils/prisma';
import { imageProcessQueue } from '../jobs/queues';

export interface GenerateImageParams {
  userId: string;
  platform: string;
  sizeType: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
}

export interface ListImagesParams {
  userId: string;
  page?: number;
  limit?: number;
}

export const createImageGeneration = async (params: GenerateImageParams) => {
  const { userId, platform, sizeType, imageUrl, prompt, negativePrompt } = params;

  // Create image record with pending status
  const image = await prisma.image.create({
    data: {
      platform,
      sizeType,
      url: imageUrl,
      promptText: prompt,
      negativePrompt,
      status: 'pending',
      userId,
    },
  });

  // Add job to Bull queue for async processing
  await imageProcessQueue.add({
    imageId: image.id,
    platform,
    sizeType,
    imageUrl,
    prompt,
    negativePrompt,
  });

  return {
    task_id: image.id,
    status: 'pending',
    estimated_time: 10,
  };
};

export const listUserImages = async (params: ListImagesParams) => {
  const { userId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where = { userId };

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        sizeType: true,
        url: true,
        status: true,
        width: true,
        height: true,
        promptText: true,
        negativePrompt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.image.count({ where }),
  ]);

  return {
    images: images.map((img) => {
      const size = img.width && img.height ? `${img.width}x${img.height}` : null;
      return {
        ...img,
        image_url: img.url,
        size,
        prompt: img.promptText,
        negative_prompt: img.negativePrompt,
        url: undefined,
        sizeType: undefined,
        promptText: undefined,
        negativePrompt: undefined,
        width: undefined,
        height: undefined,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateImageStatus = async (
  id: string,
  data: {
    status?: string;
    url?: string;
    width?: number;
    height?: number;
    metadata?: Record<string, unknown>;
  }
) => {
  return prisma.image.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
};
