import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import { authenticate } from '../middleware/auth';
import { list, search, getCategories, getById, create, update, remove } from '../controllers/prompt.controller';

const router = Router();

const createPromptSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    price: z.number().min(0).optional(),
  }),
});

const updatePromptSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    price: z.number().min(0).optional(),
  }),
});

// Public routes
router.get('/', asyncHandler(list));
router.get('/search', asyncHandler(search));
router.get('/categories', asyncHandler(getCategories));
router.get('/:id', asyncHandler(getById));

// Protected routes
router.post('/', authenticate, validate(createPromptSchema), asyncHandler(create));
router.patch('/:id', authenticate, validate(updatePromptSchema), asyncHandler(update));
router.delete('/:id', authenticate, asyncHandler(remove));

export default router;
