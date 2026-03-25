import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import * as reviewService from '../services/review.service';

// Validation schemas
const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    status: z.enum(['PENDING', 'PASSED', 'REJECTED']).optional(),
  }),
});

const reviewIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({}),
});

const rejectSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reason: z.string().min(1, '拒绝原因不能为空'),
  }),
});

// Response helper
const successResponse = (res: Response, data: any, message = 'success') => {
  res.json({ code: 0, message, data });
};

/**
 * GET /api/v1/admin/reviews
 * List reviews with pagination and status filter
 */
export const listReviews = [
  validate(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const v = req._validated!.query as {
      page: number;
      limit: number;
      status?: 'PENDING' | 'PASSED' | 'REJECTED';
    };
    const result = await reviewService.listReviews(v.page, v.limit, v.status);
    successResponse(res, result);
  }),
];

/**
 * POST /api/v1/admin/reviews/:id/pass
 * Pass a review
 */
export const passReview = [
  validate(reviewIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const reviewerId = req.user!.userId;
    const result = await reviewService.passReview(id, reviewerId);
    successResponse(res, result, '审核通过');
  }),
];

/**
 * POST /api/v1/admin/reviews/:id/reject
 * Reject a review
 */
export const rejectReview = [
  validate(rejectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const { reason } = req._validated!.body as { reason: string };
    const reviewerId = req.user!.userId;
    const result = await reviewService.rejectReview(id, reviewerId, reason);
    successResponse(res, result, '已拒绝该图片');
  }),
];

/**
 * GET /api/v1/admin/reviews/stats
 * Get review statistics
 */
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await reviewService.getStats();
  successResponse(res, stats);
});
