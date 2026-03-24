import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';

const router = Router();

const createPromptSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    price: z.number().min(0).optional(),
  }),
});

router.get('/', asyncHandler(async (req, res) => {
  // TODO: List prompts
  res.json({ prompts: [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: Get prompt by ID
  res.json({ prompt: null });
}));

router.post('/', asyncHandler(async (req, res) => {
  // TODO: Create prompt
  res.status(201).json({ message: 'Create prompt endpoint' });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  // TODO: Update prompt
  res.json({ message: 'Update prompt endpoint' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  // TODO: Delete prompt
  res.json({ message: 'Delete prompt endpoint' });
}));

export default router;
