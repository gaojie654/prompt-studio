import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { imageService, PlatformSize } from '../services/image.service';
import { asyncHandler } from '../utils/AppError';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

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

  const { platform, model, resolution, aspectRatio, promptId, imageUrl, prompt, negativePrompt } = req.body as {
    platform?: PlatformSize;
    model?: string;
    resolution?: string;
    aspectRatio?: string;
    promptId?: string;
    imageUrl?: string;
    prompt?: string;
    negativePrompt?: string;
  };

  // If using custom aspectRatio, platform is optional
  if (!platform && !aspectRatio) {
    throw new AppError('Platform or aspectRatio is required', 400, 'MISSING_PLATFORM');
  }

  const image = await imageService.generate({
    userId: req.user.userId,
    platform,
    model,
    resolution,
    aspectRatio,
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

/**
 * GET /api/images/:id/download
 * Download an image.
 * - PRO members get clean image.
 * - Free/Basic members get watermarked image by default.
 * - Paying 20 credits unlocks clean image for this download.
 */
export const download = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const id = req.params.id as string;
  const { removeWatermark } = req.query as { removeWatermark?: string };

  // Get image record
  const image = await prisma.image.findFirst({
    where: { id, userId: req.user.userId },
  });

  if (!image) {
    throw new AppError('Image not found', 404, 'NOT_FOUND');
  }

  // Resolve actual file path: prefer DB filename, fall back to URL if needed
  const BASE_DIR = './uploads/images';
  let actualFilename = image.filename;
  if (!actualFilename || !fs.existsSync(path.join(BASE_DIR, req.user.userId, actualFilename))) {
    // Filename in DB was a placeholder — extract real filename from URL
    const urlMatch = image.url.match(/\/uploads\/images\/[^/]+\/(.+)$/);
    if (urlMatch) {
      actualFilename = urlMatch[1];
    }
  }

  if (!actualFilename) {
    throw new AppError('Image file not found', 404, 'FILE_NOT_FOUND');
  }

  const filePath = path.join(BASE_DIR, req.user.userId, actualFilename);
  if (!fs.existsSync(filePath)) {
    throw new AppError('Image file not found on disk', 404, 'FILE_NOT_FOUND');
  }

  // Get user membership
  const membership = await prisma.membership.findUnique({
    where: { userId: req.user.userId },
  });

  const isPro = membership?.tier === 'PRO';
  const removeWatermarkFlag = removeWatermark === 'true';

  // Determine if we should serve a clean image
  const serveClean = isPro || !removeWatermarkFlag;

  if (serveClean) {
    // PRO or user doesn't want watermark removal — serve clean
    const ext = path.extname(actualFilename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    const displayName = `prompt-studio-${image.platform || 'image'}-${Date.now()}${ext}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${displayName}"`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-store');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  // Non-PRO: need to deduct 20 credits for clean image
  const WATERMARK_COST = 20;

  if ((membership?.credits || 0) < WATERMARK_COST) {
    throw new AppError(
      `无水印下载需要 ${WATERMARK_COST} 积分，当前积分不足（剩余 ${membership?.credits || 0} 积分）。请升级到 PRO 会员或充值。`,
      403,
      'INSUFFICIENT_CREDITS'
    );
  }

  // Deduct credits
  await prisma.membership.update({
    where: { userId: req.user.userId },
    data: { credits: { decrement: WATERMARK_COST } },
  });

  const ext = path.extname(actualFilename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  const displayName = `prompt-studio-${image.platform || 'image'}-${Date.now()}${ext}`;

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${displayName}"`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Credits-Deducted', String(WATERMARK_COST));

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});
