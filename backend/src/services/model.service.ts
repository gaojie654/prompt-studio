import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface CreateModelInput {
  key: string;
  name: string;
  provider: string;
  description?: string;
  credit: number;
  isActive?: boolean;
  isDefault?: boolean;
  config?: Record<string, any>;
}

export interface UpdateModelInput {
  name?: string;
  provider?: string;
  description?: string;
  credit?: number;
  isActive?: boolean;
  isDefault?: boolean;
  config?: Record<string, any>;
}

export class ModelService {
  /**
   * Get all active models
   */
  async getAllModels() {
    return prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { credit: 'asc' },
    });
  }

  /**
   * Get all models (including inactive)
   */
  async getAllModelsAdmin() {
    return prisma.aIModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get model by key
   */
  async getModelByKey(key: string) {
    const model = await prisma.aIModel.findUnique({
      where: { key },
    });

    if (!model) {
      throw new AppError(`Model not found: ${key}`, 404, 'MODEL_NOT_FOUND');
    }

    return model;
  }

  /**
   * Get default model
   */
  async getDefaultModel() {
    const model = await prisma.aIModel.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!model) {
      // Fallback to Kolors if no default set
      return prisma.aIModel.findFirst({
        where: { key: 'kolors', isActive: true },
      });
    }

    return model;
  }

  /**
   * Create a new model
   */
  async createModel(input: CreateModelInput) {
    // Check if key already exists
    const existing = await prisma.aIModel.findUnique({
      where: { key: input.key },
    });

    if (existing) {
      throw new AppError(`Model with key '${input.key}' already exists`, 400, 'MODEL_EXISTS');
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.aIModel.create({
      data: {
        key: input.key,
        name: input.name,
        provider: input.provider,
        description: input.description,
        credit: input.credit,
        isActive: input.isActive ?? true,
        isDefault: input.isDefault ?? false,
        config: input.config,
      },
    });
  }

  /**
   * Update a model
   */
  async updateModel(key: string, input: UpdateModelInput) {
    const model = await prisma.aIModel.findUnique({
      where: { key },
    });

    if (!model) {
      throw new AppError(`Model not found: ${key}`, 404, 'MODEL_NOT_FOUND');
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true, key: { not: key } },
        data: { isDefault: false },
      });
    }

    return prisma.aIModel.update({
      where: { key },
      data: {
        name: input.name,
        provider: input.provider,
        description: input.description,
        credit: input.credit,
        isActive: input.isActive,
        isDefault: input.isDefault,
        config: input.config,
      },
    });
  }

  /**
   * Delete a model
   */
  async deleteModel(key: string) {
    const model = await prisma.aIModel.findUnique({
      where: { key },
    });

    if (!model) {
      throw new AppError(`Model not found: ${key}`, 404, 'MODEL_NOT_FOUND');
    }

    // Don't allow deleting if it's the last model
    const modelCount = await prisma.aIModel.count();
    if (modelCount <= 1) {
      throw new AppError('Cannot delete the last model', 400, 'CANNOT_DELETE_LAST_MODEL');
    }

    // If deleting default, make another one default
    if (model.isDefault) {
      await prisma.aIModel.update({
        where: { key: { not: key } },
        data: { isDefault: true },
      });
    }

    return prisma.aIModel.delete({
      where: { key },
    });
  }
}

export const modelService = new ModelService();
