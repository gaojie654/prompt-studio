import prisma from '../utils/prisma';

export interface SearchPromptsParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ListPromptsParams {
  category?: string;
  page?: number;
  limit?: number;
}

export const searchPrompts = async (params: SearchPromptsParams) => {
  const { q, category, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isPublic: true };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { useCount: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        useCount: true,
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return {
    prompts: prompts.map((p) => ({
      ...p,
      usage_count: p.useCount,
      useCount: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const listPrompts = async (params: ListPromptsParams) => {
  const { category, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isPublic: true };
  if (category) {
    where.category = category;
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { useCount: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        useCount: true,
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return {
    prompts: prompts.map((p) => ({
      ...p,
      usage_count: p.useCount,
      useCount: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPromptById = async (id: string) => {
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      description: true,
      category: true,
      tags: true,
      isPublic: true,
      isFeatured: true,
      useCount: true,
      price: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!prompt) return null;

  // Increment use count
  await prisma.prompt.update({
    where: { id },
    data: { useCount: { increment: 1 } },
  });

  return {
    ...prompt,
    usage_count: prompt.useCount,
    useCount: undefined,
  };
};
