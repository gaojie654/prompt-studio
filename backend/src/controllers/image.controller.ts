import { Request, Response } from 'express';
import { imageService, PlatformSize } from '../services/image.service';
import { asyncHandler } from '../utils/AppError';
import { AppError } from '../utils/AppError';

/**
 * POST /api/images/upload
 * Upload a base64 reference image and get a URL
 */
export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const { image } = req.body as { image?: string };

  if (!image) {
    throw new AppError('Image data is required', 400, 'MISSING_IMAGE');
  }

  // Validate it's a data URI
  if (!image.startsWith('data:image/')) {
    throw new AppError('Invalid image format. Expected base64 data URI.', 400, 'INVALID_IMAGE_FORMAT');
  }

  const result = await imageService.uploadReferenceImage(req.user.userId, image);

  res.status(201).json({
    code: 0,
    message: 'Image uploaded successfully',
    data: result,
  });
});

/**
 * POST /api/images/generate
 * Generate a new image
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const { platform, promptId, imageUrl, prompt, negativePrompt } = req.body as {
    platform: PlatformSize;
    promptId?: string;
    imageUrl?: string;
    prompt?: string;
    negativePrompt?: string;
  };

  if (!platform) {
    throw new AppError('Platform is required', 400, 'MISSING_PLATFORM');
  }

  const image = await imageService.generate({
    userId: req.user.userId,
    platform,
    promptId,
    imageUrl,
    prompt,
    negativePrompt,
  });

  res.status(201).json({
    code: 0,
    message: 'Image generated successfully',
    data: image,
  });
});

/**
 * GET /api/images
 * Get user's images
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const page = req.query.page as string | undefined;
  const pageSize = req.query.pageSize as string | undefined;

  const result = await imageService.getUserImages(
    req.user.userId,
    page ? parseInt(page, 10) : 1,
    pageSize ? parseInt(pageSize, 10) : 20
  );

  res.json({
    code: 0,
    message: 'success',
    data: result.images,
    pagination: result.pagination,
  });
});

/**
 * GET /api/images/:id
 * Get image by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const id = req.params.id as string;
  const image = await imageService.getById(id, req.user.userId);

  res.json({
    code: 0,
    message: 'success',
    data: image,
  });
});

/**
 * DELETE /api/images/:id
 * Delete an image
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const id = req.params.id as string;
  await imageService.delete(id, req.user.userId);

  res.json({
    code: 0,
    message: 'Image deleted successfully',
  });
});

/**
 * GET /api/images/platforms/sizes
 * Get available platform sizes
 */
export const getPlatformSizes = asyncHandler(async (_req: Request, res: Response) => {
  const sizes = imageService.getPlatformSizes();

  res.json({
    code: 0,
    message: 'success',
    data: sizes,
  });
});
