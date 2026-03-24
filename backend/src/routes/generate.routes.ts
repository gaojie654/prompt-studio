import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/AppError';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { createImageGeneration } from '../services/image.service';

const router = Router();

const generateSchema = z.object({
  body: z.object({
    platform: z.string().min(1),
    size_type: z.string().min(1),
    image_url: z.string().url(),
    prompt: z.string().min(1),
    negative_prompt: z.string().optional(),
  }),
});

router.post(
  '/',
  authenticate,
  validate(generateSchema),
  asyncHandler(async (req, res) => {
    const { platform, size_type, image_url, prompt, negative_prompt } = req.body;
    const userId = req.user!.userId;

    const result = await createImageGeneration({
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
  })
);

export default router;
