import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import { generate, list, getById, remove, getPlatformSizes, upload, download } from '../controllers/image.controller';

const router: Router = Router();

const generateImageSchema = z.object({
  body: z.object({
    platform: z.string().min(1, 'Platform is required'),
    promptId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    prompt: z.string().optional(),
    negativePrompt: z.string().optional(),
  }),
});

const uploadImageSchema = z.object({
  body: z.object({
    image: z.string().min(1, 'Image data is required'),
  }),
});

// Public route - get available sizes
router.get('/platforms/sizes', asyncHandler(getPlatformSizes));

// Protected routes
router.post('/upload', authenticate, validate(uploadImageSchema), asyncHandler(upload));
router.post('/generate', authenticate, validate(generateImageSchema), asyncHandler(generate));
router.get('/', authenticate, asyncHandler(list));
router.get('/:id/download', authenticate, asyncHandler(download));
router.get('/:id', authenticate, asyncHandler(getById));
router.delete('/:id', authenticate, asyncHandler(remove));

export default router;
