import { Request, Response } from 'express';
import { promptService } from '../services/prompt.service';
import { asyncHandler } from '../utils/AppError';
import { AppError } from '../utils/AppError';

/**
 * GET /api/prompts
 * List prompts with filtering
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string | undefined;
  const category = req.query.category as string | undefined;
  const tags = req.query.tags as string | undefined;
  const page = req.query.page as string | undefined;
  const pageSize = req.query.pageSize as string | undefined;

  const result = await promptService.list({
    keyword,
    category,
    tags: tags ? tags.split(',') : undefined,
    page: page ? parseInt(page, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize, 10) : 20,
  });

  res.json({
    code: 0,
    message: 'success',
    data: result.prompts,
    pagination: result.pagination,
  });
});

/**
 * GET /api/prompts/search
 * Search prompts by keyword
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string | undefined;
  const limit = req.query.limit as string | undefined;

  if (!keyword) {
    throw new AppError('Keyword is required', 400, 'MISSING_KEYWORD');
  }

  const prompts = await promptService.search(
    keyword,
    limit ? parseInt(limit, 10) : 10
  );

  res.json({
    code: 0,
    message: 'success',
    data: prompts,
  });
});

/**
 * GET /api/prompts/categories
 * Get all categories
 */
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await promptService.getCategories();

  res.json({
    code: 0,
    message: 'success',
    data: categories,
  });
});

/**
 * GET /api/prompts/:id
 * Get prompt by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const prompt = await promptService.getById(id);

  res.json({
    code: 0,
    message: 'success',
    data: prompt,
  });
});

/**
 * POST /api/prompts
 * Create a new prompt
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const { title, content, description, category, tags, isPublic, price } = req.body as {
    title: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    price?: number;
  };

  const prompt = await promptService.create({
    title,
    content,
    description,
    category,
    tags,
    isPublic,
    price,
    authorId: req.user.userId,
  });

  res.status(201).json({
    code: 0,
    message: 'Prompt created successfully',
    data: prompt,
  });
});

/**
 * PATCH /api/prompts/:id
 * Update a prompt
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const id = req.params.id as string;
  const { title, content, description, category, tags, isPublic, price } = req.body as {
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    price?: number;
  };

  const prompt = await promptService.update(id, req.user.userId, {
    title,
    content,
    description,
    category,
    tags,
    isPublic,
    price,
  });

  res.json({
    code: 0,
    message: 'Prompt updated successfully',
    data: prompt,
  });
});

/**
 * DELETE /api/prompts/:id
 * Delete a prompt
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const id = req.params.id as string;
  await promptService.delete(id, req.user.userId);

  res.json({
    code: 0,
    message: 'Prompt deleted successfully',
  });
});
