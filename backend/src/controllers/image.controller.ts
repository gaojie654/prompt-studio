import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler, AppError } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import * as imageService from '../services/image.service';

const generateSchema = z.object({
  body: z.object({
    platform: z.string().min(1),
    size_type: z.string().min(1),
    image_url: z.string().url(),
    prompt: z.string().min(1),
    negative_prompt: z.string().optional(),
  }),
});

const listImagesSchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  }),
});

export const generateImage = [
  authenticate,
  validate(generateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { platform, size_type, image_url, prompt, negative_prompt } = req.body;
    const userId = req.user!.userId;

    const result = await imageService.createImageGeneration({
      userId,
      platform,
      sizeType: size_type,
      imageUrl: image_url,
      prompt,
      negativePrompt: negative_prompt,
    });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  }),
];

export const listImages = [
  authenticate,
  validate(listImagesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as { page?: number; limit?: number };
    const userId = req.user!.userId;

    const result = await imageService.listUserImages({ userId, page, limit });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  }),
];

export const getImageById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Get image - in a real implementation, you'd check ownership
  // For now just return not found if doesn't exist
  const result = await imageService.listUserImages({ userId, page: 1, limit: 100 });

  const image = result.images.find((img) => img.id === id);
  if (!image) {
    return next(new AppError('Image not found', 404, 'NOT_FOUND'));
  }

  res.json({
    code: 0,
    message: 'success',
    data: image,
  });
});
