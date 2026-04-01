import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import { modelService } from '../services/model.service';

// Validation schemas
const createModelSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Key is required'),
    name: z.string().min(1, 'Name is required'),
    provider: z.string().min(1, 'Provider is required'),
    description: z.string().optional(),
    credit: z.number().int().min(1).default(10),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    config: z.record(z.any()).optional(),
  }),
});

const updateModelSchema = z.object({
  params: z.object({
    key: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    provider: z.string().optional(),
    description: z.string().optional(),
    credit: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    config: z.record(z.any()).optional(),
  }),
});

const deleteModelSchema = z.object({
  params: z.object({
    key: z.string(),
  }),
  body: z.object({}),
});

// Response helper
const successResponse = (res: Response, data: any, message = 'success') => {
  res.json({ code: 0, message, data });
};

/**
 * GET /api/v1/admin/models
 * List all models (for admin)
 */
export const listModels = asyncHandler(async (_req: Request, res: Response) => {
  const models = await modelService.getAllModelsAdmin();
  successResponse(res, models);
});

/**
 * GET /api/v1/models
 * List active models (for users)
 */
export const listActiveModels = asyncHandler(async (_req: Request, res: Response) => {
  const models = await modelService.getAllModels();
  successResponse(res, models);
});

/**
 * POST /api/v1/admin/models
 * Create a new model
 */
export const createModel = [
  validate(createModelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req._validated!.body as z.infer<typeof createModelSchema>['body'];
    const model = await modelService.createModel(body);
    successResponse(res, model, 'Model created successfully');
  }),
];

/**
 * PUT /api/v1/admin/models/:key
 * Update a model
 */
export const updateModel = [
  validate(updateModelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req._validated!.params as { key: string };
    const body = req._validated!.body as z.infer<typeof updateModelSchema>['body'];
    const model = await modelService.updateModel(key, body);
    successResponse(res, model, 'Model updated successfully');
  }),
];

/**
 * DELETE /api/v1/admin/models/:key
 * Delete a model
 */
export const deleteModel = [
  validate(deleteModelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req._validated!.params as { key: string };
    await modelService.deleteModel(key);
    successResponse(res, null, 'Model deleted successfully');
  }),
];
