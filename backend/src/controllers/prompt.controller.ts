import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler, AppError } from '../utils/AppError';
import * as promptService from '../services/prompt.service';

const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  }),
});

const listQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  }),
});

export const searchPrompts = [
  validate(searchQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, category, page, limit } = req.query as {
      q?: string;
      category?: string;
      page?: number;
      limit?: number;
    };

    const result = await promptService.searchPrompts({ q, category, page, limit });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  }),
];

export const listPrompts = [
  validate(listQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { category, page, limit } = req.query as {
      category?: string;
      page?: number;
      limit?: number;
    };

    const result = await promptService.listPrompts({ category, page, limit });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  }),
];

export const getPromptById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const prompt = await promptService.getPromptById(id);

  if (!prompt) {
    return next(new AppError('Prompt not found', 404, 'NOT_FOUND'));
  }

  res.json({
    code: 0,
    message: 'success',
    data: prompt,
  });
});
