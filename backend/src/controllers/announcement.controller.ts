import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/AppError';
import * as announcementService from '../services/announcement.service';

// Validation schemas
const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  }),
});

const announcementIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({}),
});

const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, '标题不能为空'),
    content: z.string().min(1, '内容不能为空'),
    isPinned: z.boolean().optional(),
    isPopup: z.boolean().optional(),
    isActive: z.boolean().optional(),
    startAt: z.string().datetime().optional().nullable(),
    endAt: z.string().datetime().optional().nullable(),
  }),
});

const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    isPinned: z.boolean().optional(),
    isPopup: z.boolean().optional(),
    isActive: z.boolean().optional(),
    startAt: z.string().datetime().optional().nullable(),
    endAt: z.string().datetime().optional().nullable(),
  }),
});

// Response helper
const successResponse = (res: Response, data: any, message = 'success') => {
  res.json({ code: 0, message, data });
};

/**
 * GET /api/v1/announcements
 * Get active announcements (public)
 */
export const getActiveAnnouncements = asyncHandler(
  async (_req: Request, res: Response) => {
    const announcements = await announcementService.getActiveAnnouncements();
    successResponse(res, announcements);
  }
);

/**
 * GET /api/v1/admin/announcements
 * List all announcements (admin)
 */
export const listAnnouncements = [
  validate(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const v = req._validated!.query as { page: number; limit: number };
    const result = await announcementService.listAnnouncements(v.page, v.limit);
    successResponse(res, result);
  }),
];

/**
 * GET /api/v1/admin/announcements/:id
 * Get announcement by ID
 */
export const getAnnouncement = [
  validate(announcementIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const announcement = await announcementService.getById(id);
    successResponse(res, announcement);
  }),
];

/**
 * POST /api/v1/admin/announcements
 * Create a new announcement
 */
export const createAnnouncement = [
  validate(createAnnouncementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req._validated!.body as {
      title: string;
      content: string;
      isPinned?: boolean;
      isPopup?: boolean;
      isActive?: boolean;
      startAt?: string | null;
      endAt?: string | null;
    };
    const data = {
      ...body,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    };
    const announcement = await announcementService.create(data);
    successResponse(res, announcement, '公告创建成功');
  }),
];

/**
 * PUT /api/v1/admin/announcements/:id
 * Update an announcement
 */
export const updateAnnouncement = [
  validate(updateAnnouncementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const body = req._validated!.body as {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isPopup?: boolean;
      isActive?: boolean;
      startAt?: string | null;
      endAt?: string | null;
    };
    const data = {
      ...body,
      startAt: body.startAt !== undefined ? (body.startAt ? new Date(body.startAt) : null) : undefined,
      endAt: body.endAt !== undefined ? (body.endAt ? new Date(body.endAt) : null) : undefined,
    };
    const announcement = await announcementService.update(id, data);
    successResponse(res, announcement, '公告更新成功');
  }),
];

/**
 * DELETE /api/v1/admin/announcements/:id
 * Delete an announcement
 */
export const deleteAnnouncement = [
  validate(announcementIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    await announcementService.deleteAnnouncement(id);
    successResponse(res, null, '公告删除成功');
  }),
];

/**
 * PUT /api/v1/admin/announcements/:id/toggle-pinned
 * Toggle pinned status
 */
export const togglePinned = [
  validate(announcementIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const result = await announcementService.togglePinned(id);
    successResponse(res, result);
  }),
];

/**
 * PUT /api/v1/admin/announcements/:id/toggle-active
 * Toggle active status
 */
export const toggleActive = [
  validate(announcementIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req._validated!.params as { id: string };
    const result = await announcementService.toggleActive(id);
    successResponse(res, result);
  }),
];
