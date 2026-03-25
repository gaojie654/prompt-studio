import { Request, Response } from 'express';
import { promptService } from '../services/prompt.service';
import { asyncHandler } from '../utils/AppError';
import { AppError } from '../utils/AppError';

/**
 * GET /api/prompts
 * List prompts with filtering
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, category, tags, page, pageSize } = req.query;

  const result = await promptService.list({
    keyword: keyword as string,
    category: category as string,
    tags: tags ? (tags as string).split(',') : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
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
  const { keyword, limit } = req.query;

  if (!keyword) {
    throw new AppError('Keyword is required', 400, 'MISSING_KEYWORD');
  }

  const prompts = await promptService.search(
    keyword as string,
    limit ? parseInt(limit as string, 10) : 10
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
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
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
  const { id } = req.params;
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

  const { title, content, description, category, tags, isPublic, price } = req.body;

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

  const { id } = req.params;
  const { title, content, description, category, tags, isPublic, price } = req.body;

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

  const { id } = req.params;
  await promptService.delete(id, req.user.userId);

  res.json({
    code: 0,
    message: 'Prompt deleted successfully',
  });
});
