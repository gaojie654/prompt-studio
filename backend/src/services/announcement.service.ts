import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface AnnouncementData {
  title: string;
  content: string;
  isPinned?: boolean;
  isPopup?: boolean;
  isActive?: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
}

export interface AnnouncementListResult {
  announcements: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    isPopup: boolean;
    isActive: boolean;
    startAt: Date | null;
    endAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get active announcements for user display (public)
 */
export const getActiveAnnouncements = async () => {
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { startAt: null, endAt: null },
        { startAt: { lte: now }, endAt: null },
        { startAt: null, endAt: { gte: now } },
        { startAt: { lte: now }, endAt: { gte: now } },
      ],
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return announcements;
};

/**
 * List all announcements (admin)
 */
export const listAnnouncements = async (
  page: number = 1,
  limit: number = 20
): Promise<AnnouncementListResult> => {
  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      skip,
      take: limit,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.announcement.count(),
  ]);

  return {
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
      isPopup: a.isPopup,
      isActive: a.isActive,
      startAt: a.startAt,
      endAt: a.endAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get announcement by ID
 */
export const getById = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  return announcement;
};

/**
 * Create a new announcement
 */
export const create = async (data: AnnouncementData) => {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned || false,
      isPopup: data.isPopup || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      startAt: data.startAt || null,
      endAt: data.endAt || null,
    },
  });

  return announcement;
};

/**
 * Update an announcement
 */
export const update = async (
  id: string,
  data: Partial<AnnouncementData>
) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      ...(data.isPopup !== undefined && { isPopup: data.isPopup }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.startAt !== undefined && { startAt: data.startAt }),
      ...(data.endAt !== undefined && { endAt: data.endAt }),
    },
  });

  return updated;
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  await prisma.announcement.delete({
    where: { id },
  });
};

/**
 * Toggle pinned status
 */
export const togglePinned = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { isPinned: true },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
    select: { isPinned: true },
  });

  return { isPinned: updated.isPinned };
};

/**
 * Toggle active status
 */
export const toggleActive = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { isActive: !announcement.isActive },
    select: { isActive: true },
  });

  return { isActive: updated.isActive };
};
