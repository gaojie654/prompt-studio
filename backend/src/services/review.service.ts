import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

// Review status enum
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REJECTED';

// Keywords for auto-review (configurable)
const AUTO_REJECT_KEYWORDS = [
  'porn', 'nude', 'sex', 'xxx',
  'gore', 'violence', 'blood',
  'copyright', 'trademark',
];

export interface ReviewListResult {
  reviews: {
    id: string;
    imageId: string;
    imageUrl: string;
    imageWidth: number | null;
    imageHeight: number | null;
    userId: string;
    userEmail: string;
    promptTitle: string | null;
    status: ReviewStatus;
    rejectReason: string | null;
    reviewerId: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewStats {
  pending: number;
  passed: number;
  rejected: number;
  total: number;
  todayPending: number;
  todayPassed: number;
  todayRejected: number;
}

/**
 * Create a review record for a newly generated image
 */
export const createReview = async (imageId: string): Promise<any> => {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: { prompt: { select: { title: true } } },
  });

  if (!image) {
    throw new AppError('Image not found', 404, 'IMAGE_NOT_FOUND');
  }

  // Auto-check keywords (optional - can be disabled)
  const promptContent = image.prompt?.title || '';
  const hasBlockedKeyword = AUTO_REJECT_KEYWORDS.some((keyword) =>
    promptContent.toLowerCase().includes(keyword)
  );

  // Create review record
  const review = await prisma.review.create({
    data: {
      imageId,
      status: hasBlockedKeyword ? 'REJECTED' : 'PENDING',
      rejectReason: hasBlockedKeyword ? '自动检测：内容包含敏感关键词' : null,
      reviewedAt: hasBlockedKeyword ? new Date() : null,
    },
  });

  return review;
};

/**
 * Get pending reviews with pagination
 */
export const listReviews = async (
  page: number = 1,
  limit: number = 20,
  status?: ReviewStatus
): Promise<ReviewListResult> => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            userId: true,
            user: {
              select: { email: true },
            },
            prompt: {
              select: { title: true },
            },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      imageId: r.imageId,
      imageUrl: r.image.url,
      imageWidth: r.image.width,
      imageHeight: r.image.height,
      userId: r.image.userId,
      userEmail: r.image.user.email,
      promptTitle: r.image.prompt?.title || null,
      status: r.status as ReviewStatus,
      rejectReason: r.rejectReason,
      reviewerId: r.reviewerId,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
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
 * Pass a review
 */
export const passReview = async (
  reviewId: string,
  reviewerId: string
): Promise<any> => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  if (review.status !== 'PENDING') {
    throw new AppError('Review already processed', 400, 'ALREADY_PROCESSED');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: 'PASSED',
      reviewerId,
      reviewedAt: new Date(),
    },
    include: {
      image: {
        select: {
          url: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return updated;
};

/**
 * Reject a review
 */
export const rejectReview = async (
  reviewId: string,
  reviewerId: string,
  reason: string
): Promise<any> => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  if (review.status !== 'PENDING') {
    throw new AppError('Review already processed', 400, 'ALREADY_PROCESSED');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: 'REJECTED',
      reviewerId,
      rejectReason: reason,
      reviewedAt: new Date(),
    },
    include: {
      image: {
        select: {
          url: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return updated;
};

/**
 * Get review statistics
 */
export const getStats = async (): Promise<ReviewStats> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [pending, passed, rejected, todayPending, todayPassed, todayRejected] =
    await Promise.all([
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'PASSED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.review.count({
        where: {
          status: 'PASSED',
          reviewedAt: { gte: startOfToday },
        },
      }),
      prisma.review.count({
        where: {
          status: 'REJECTED',
          reviewedAt: { gte: startOfToday },
        },
      }),
    ]);

  return {
    pending,
    passed,
    rejected,
    total: pending + passed + rejected,
    todayPending,
    todayPassed,
    todayRejected,
  };
};

/**
 * Get user's image reviews (for profile/history)
 */
export const getUserReviews = async (
  userId: string,
  page: number = 1,
  pageSize: number = 20
) => {
  const skip = (page - 1) * pageSize;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        image: { userId },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            width: true,
            height: true,
            prompt: { select: { title: true } },
          },
        },
      },
    }),
    prisma.review.count({
      where: { image: { userId } },
    }),
  ]);

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      imageId: r.imageId,
      imageUrl: r.image.url,
      imageWidth: r.image.width,
      imageHeight: r.image.height,
      promptTitle: r.image.prompt?.title || null,
      status: r.status,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};
