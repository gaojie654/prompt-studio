import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import * as adminService from '../services/admin.service';

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    search: z.string().optional(),
    memberType: z.string().optional(),
  }),
});

const orderQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    status: z.enum(['pending', 'paid', 'expired', 'refunded']).optional(),
    type: z.enum(['recharge', 'membership']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

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
  params: z.object({
    id: z.string(),
  }),
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

const deletePromptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({}),
});

const toggleFeaturedSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({}),
});

const toggleUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({}),
});

const settingsSchema = z.object({
  body: z.object({}).passthrough(),
});

// Response helper
const successResponse = (res: Response, data: any, message = 'success') => {
  res.json({ code: 0, message, data });
};

/**
 * POST /api/v1/admin/login
 * Admin login
 */
export const login = [
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await adminService.adminLogin(email, password);
    successResponse(res, result);
  }),
];

/**
 * GET /api/v1/admin/stats
 * Get dashboard statistics
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getStats();
  successResponse(res, stats);
});

/**
 * GET /api/v1/admin/users
 * List users with pagination
 */
export const listUsers = [
  validate(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, memberType } = req.query as any;
    const result = await adminService.listUsers(page, limit, search, memberType);
    successResponse(res, result);
  }),
];

/**
 * POST /api/v1/admin/users/:id/toggle
 * Toggle user disabled status
 */
export const toggleUser = [
  validate(toggleUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.toggleUser(id);
    successResponse(res, result);
  }),
];

/**
 * GET /api/v1/admin/orders
 * List orders with pagination and filters
 */
export const listOrders = [
  validate(orderQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, status, type, startDate, endDate } = req.query as any;
    const result = await adminService.listOrders(page, limit, status, type, startDate, endDate);
    successResponse(res, result);
  }),
];

/**
 * GET /api/v1/admin/prompts
 * List all prompts (admin view)
 */
export const listPrompts = [
  validate(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const result = await adminService.listPrompts(page, limit);
    successResponse(res, result);
  }),
];

/**
 * POST /api/v1/admin/prompts
 * Create a new prompt
 */
export const createPrompt = [
  validate(createPromptSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authorId = req.user!.userId;
    const prompt = await adminService.createPrompt({ ...req.body, authorId });
    successResponse(res, prompt, 'Prompt created successfully');
  }),
];

/**
 * PUT /api/v1/admin/prompts/:id
 * Update a prompt
 */
export const updatePrompt = [
  validate(updatePromptSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const prompt = await adminService.updatePrompt(id, req.body);
    successResponse(res, prompt, 'Prompt updated successfully');
  }),
];

/**
 * DELETE /api/v1/admin/prompts/:id
 * Delete a prompt
 */
export const deletePrompt = [
  validate(deletePromptSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminService.deletePrompt(id);
    successResponse(res, null, 'Prompt deleted successfully');
  }),
];

/**
 * PUT /api/v1/admin/prompts/:id/featured
 * Toggle featured status
 */
export const toggleFeatured = [
  validate(toggleFeaturedSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.toggleFeatured(id);
    successResponse(res, result);
  }),
];

/**
 * GET /api/v1/admin/settings
 * Get system settings
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await adminService.getSettings();
  successResponse(res, settings);
});

/**
 * PUT /api/v1/admin/settings
 * Update system settings
 */
export const updateSettings = [
  validate(settingsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const settings = await adminService.updateSettings(req.body);
    successResponse(res, settings, 'Settings updated successfully');
  }),
];
