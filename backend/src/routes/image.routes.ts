import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import { generate, list, getById, remove, getPlatformSizes } from '../controllers/image.controller';

const router = Router();

const generateImageSchema = z.object({
  body: z.object({
    platform: z.string().min(1, 'Platform is required'),
    promptId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    prompt: z.string().optional(),
    negativePrompt: z.string().optional(),
  }),
});

// Public route - get available sizes
router.get('/platforms/sizes', asyncHandler(getPlatformSizes));

// Protected routes
router.post('/generate', authenticate, validate(generateImageSchema), asyncHandler(generate));
router.get('/', authenticate, asyncHandler(list));
router.get('/:id', authenticate, asyncHandler(getById));
router.delete('/:id', authenticate, asyncHandler(remove));

export default router;
