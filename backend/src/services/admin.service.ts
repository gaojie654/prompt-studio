import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import config from '../config';
import { AppError } from '../utils/AppError';

// Types
export interface AdminLoginResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
}

export interface StatsData {
  todayUsers: number;
  todayOrders: number;
  todayRevenue: number;
  todayImages: number;
  totalUsers: number;
  totalRevenue: number;
  userTrend: { date: string; count: number }[];
  revenueTrend: { date: string; amount: number }[];
}

export interface UserListResult {
  users: {
    id: string;
    email: string;
    name: string | null;
    memberType: string;
    balance: number;
    isActive: boolean;
    createdAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderListResult {
  orders: {
    id: string;
    orderNo: string;
    userId: string;
    userEmail: string;
    type: string;
    amount: number;
    paymentMethod: string;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PromptListResult {
  prompts: {
    id: string;
    title: string;
    content: string;
    description: string | null;
    category: string | null;
    tags: string[];
    isPublic: boolean;
    isFeatured: boolean;
    price: number;
    viewCount: number;
    likeCount: number;
    useCount: number;
    authorId: string;
    authorEmail: string;
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

// Helper to get start of day
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to get start of N days ago
const startOfDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Admin login - authenticates admin user
 */
export const adminLogin = async (email: string, password: string): Promise<AdminLoginResult> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
  };
};

/**
 * Get dashboard statistics
 */
export const getStats = async (): Promise<StatsData> => {
  const now = new Date();
  const todayStart = startOfDay(now);

  // Today's metrics
  const [todayUsers, todayOrders, todayImages, totalUsers] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart }, status: 'PAID' },
    }),
    prisma.image.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.user.count(),
  ]);

  // Today's revenue
  const todayRevenueResult = await prisma.order.aggregate({
    where: { createdAt: { gte: todayStart }, status: 'PAID' },
    _sum: { amount: true },
  });
  const todayRevenue = todayRevenueResult._sum.amount || 0;

  // Total revenue
  const totalRevenueResult = await prisma.order.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true },
  });
  const totalRevenue = totalRevenueResult._sum.amount || 0;

  // User trend - last 7 days
  const userTrend: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDaysAgo(i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    });

    userTrend.push({
      date: dayStart.toISOString().split('T')[0],
      count,
    });
  }

  // Revenue trend - last 7 days
  const revenueTrend: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDaysAgo(i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const result = await prisma.order.aggregate({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        status: 'PAID',
      },
      _sum: { amount: true },
    });

    revenueTrend.push({
      date: dayStart.toISOString().split('T')[0],
      amount: result._sum.amount || 0,
    });
  }

  return {
    todayUsers,
    todayOrders,
    todayRevenue,
    todayImages,
    totalUsers,
    totalRevenue,
    userTrend,
    revenueTrend,
  };
};

/**
 * List users with pagination and search
 */
export const listUsers = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  memberType?: string
): Promise<UserListResult> => {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (memberType) {
    where.membership = {
      tier: memberType.toUpperCase(),
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        membership: {
          select: { tier: true, credits: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      memberType: u.membership?.tier || 'FREE',
      balance: u.membership?.credits || 0,
      isActive: u.isActive,
      createdAt: u.createdAt,
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
 * Toggle user disabled status
 */
export const toggleUser = async (userId: string): Promise<{ disabled: boolean }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { isActive: true },
  });

  return { disabled: !updated.isActive };
};

/**
 * List orders with pagination and filters
 */
export const listOrders = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
  type?: string,
  startDate?: string,
  endDate?: string
): Promise<OrderListResult> => {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (status) {
    where.status = status.toUpperCase();
  }

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      userId: o.userId,
      userEmail: o.user.email,
      type: o.type,
      amount: o.amount,
      paymentMethod: o.paymentMethod,
      status: o.status,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
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
 * List prompts for admin
 */
export const listPrompts = async (
  page: number = 1,
  limit: number = 20
): Promise<PromptListResult> => {
  const skip = (page - 1) * limit;

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { email: true },
        },
        images: {
          select: { id: true, url: true },
          take: 5,
        },
      },
    }),
    prisma.prompt.count(),
  ]);

  return {
    prompts: prompts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      description: p.description,
      category: p.category,
      promptType: (p.category && (p.category.includes('Video') || p.category.includes('视频'))) ? '视频' : '图片',
      tags: p.tags,
      isPublic: p.isPublic,
      isFeatured: p.isFeatured,
      price: p.price,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      useCount: p.useCount,
      authorId: p.authorId,
      authorEmail: p.author?.email ?? null,
      images: p.images,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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
 * Create a new prompt
 */
export const createPrompt = async (data: {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  price?: number;
  authorId: string;
}): Promise<any> => {
  const prompt = await prisma.prompt.create({
    data: {
      title: data.title,
      content: data.content,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      price: data.price || 0,
      authorId: data.authorId,
    },
    include: {
      author: {
        select: { email: true },
      },
    },
  });

  return prompt;
};

/**
 * Update a prompt
 */
export const updatePrompt = async (
  promptId: string,
  data: {
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    price?: number;
  }
): Promise<any> => {
  const prompt = await prisma.prompt.update({
    where: { id: promptId },
    data,
    include: {
      author: {
        select: { email: true },
      },
    },
  });

  return prompt;
};

/**
 * Delete a prompt
 */
export const deletePrompt = async (promptId: string): Promise<void> => {
  await prisma.prompt.delete({
    where: { id: promptId },
  });
};

/**
 * Toggle featured status of a prompt
 */
export const toggleFeatured = async (promptId: string): Promise<{ isFeatured: boolean }> => {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { isFeatured: true },
  });

  if (!prompt) {
    throw new AppError('Prompt not found', 404, 'PROMPT_NOT_FOUND');
  }

  const updated = await prisma.prompt.update({
    where: { id: promptId },
    data: { isFeatured: !prompt.isFeatured },
    select: { isFeatured: true },
  });

  return { isFeatured: updated.isFeatured };
};

/**
 * Add an image to a prompt
 */
export const addPromptImage = async (promptId: string, imageData: string): Promise<any> => {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
  });

  if (!prompt) {
    throw new AppError('Prompt not found', 404, 'PROMPT_NOT_FOUND');
  }

  // Create image linked to the prompt
  // Use a placeholder userId since this is an admin operation
  // The image will be associated with the prompt via promptId
  const image = await prisma.image.create({
    data: {
      url: imageData, // base64 data URI
      userId: prompt.authorId || 'system',
      promptId: promptId,
    },
  });

  return image;
};

/**
 * Delete an image from a prompt
 */
export const deletePromptImage = async (imageId: string): Promise<void> => {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new AppError('Image not found', 404, 'IMAGE_NOT_FOUND');
  }

  await prisma.image.delete({
    where: { id: imageId },
  });
};

/**
 * Get system settings
 */
export const getSettings = async (): Promise<Record<string, any>> => {
  // Return default settings - in production this would come from a settings table
  return {
    aiModels: {
      default: 'gpt-4',
      available: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
    },
    pricing: {
      imageGeneration: 10,
      membershipBasic: 99,
      membershipPro: 299,
    },
    quotas: {
      freeCredits: 100,
      basicCredits: 1000,
      proCredits: 5000,
    },
  };
};

/**
 * Update system settings
 */
export const updateSettings = async (settings: Record<string, any>): Promise<Record<string, any>> => {
  // In production, validate and persist settings
  // For now, return the settings as accepted
  return settings;
};
