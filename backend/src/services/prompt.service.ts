import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface CreatePromptInput {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  price?: number;
  authorId: string;
}

export interface UpdatePromptInput {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  price?: number;
}

export interface PromptSearchInput {
  keyword?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
}

export class PromptService {
  /**
   * Create a new prompt
   */
  async create(input: CreatePromptInput) {
    const prompt = await prisma.prompt.create({
      data: {
        title: input.title,
        content: input.content,
        description: input.description,
        category: input.category,
        tags: input.tags || [],
        isPublic: input.isPublic || false,
        price: input.price || 0,
        authorId: input.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return prompt;
  }

  /**
   * Get prompt by ID
   */
  async getById(id: string) {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        images: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404, 'NOT_FOUND');
    }

    // Increment view count
    await prisma.prompt.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return prompt;
  }

  /**
   * List prompts with filtering and pagination
   */
  async list(input: PromptSearchInput) {
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (input.keyword) {
      where.OR = [
        { title: { contains: input.keyword, mode: 'insensitive' } },
        { content: { contains: input.keyword, mode: 'insensitive' } },
        { description: { contains: input.keyword, mode: 'insensitive' } },
      ];
    }

    if (input.category) {
      where.category = input.category;
    }

    if (input.tags && input.tags.length > 0) {
      where.tags = { hasSome: input.tags };
    }

    if (input.authorId) {
      where.authorId = input.authorId;
    }

    if (input.isPublic !== undefined) {
      where.isPublic = input.isPublic;
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return {
      prompts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Search prompts by keyword (for AI matching)
   */
  async search(keyword: string, limit: number = 10) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    // Simple keyword matching - in production, use embedding/semantic search
    const prompts = await prisma.prompt.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { tags: { hasSome: [keyword.toLowerCase()] } },
        ],
      },
      take: limit,
      orderBy: [
        { useCount: 'desc' },
        { likeCount: 'desc' },
        { viewCount: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return prompts;
  }

  /**
   * Update a prompt
   */
  async update(id: string, userId: string, input: UpdatePromptInput) {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404, 'NOT_FOUND');
    }

    if (prompt.authorId !== userId) {
      throw new AppError('Not authorized to update this prompt', 403, 'FORBIDDEN');
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        title: input.title,
        content: input.content,
        description: input.description,
        category: input.category,
        tags: input.tags,
        isPublic: input.isPublic,
        price: input.price,
      },
    });

    return updated;
  }

  /**
   * Delete a prompt
   */
  async delete(id: string, userId: string) {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new AppError('Prompt not found', 404, 'NOT_FOUND');
    }

    if (prompt.authorId !== userId) {
      throw new AppError('Not authorized to delete this prompt', 403, 'FORBIDDEN');
    }

    await prisma.prompt.delete({
      where: { id },
    });
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const categories = await prisma.prompt.findMany({
      where: {
        isPublic: true,
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category).filter(Boolean);
  }

  /**
   * Increment use count
   */
  async incrementUseCount(id: string) {
    await prisma.prompt.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
  }
}

export const promptService = new PromptService();
