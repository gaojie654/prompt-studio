import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export interface UpdateUserInput {
  name?: string;
  avatar?: string;
}

export class UserService {
  /**
   * Get user by ID
   */
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        membership: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        membership: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        avatar: input.avatar,
      },
      include: {
        membership: true,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user balance/credits
   */
  async getBalance(userId: string) {
    const membership = await prisma.membership.findUnique({
      where: { userId },
    });

    if (!membership) {
      // Return default free tier
      return {
        credits: 100,
        tier: 'FREE',
        expiresAt: null,
      };
    }

    return {
      credits: membership.credits,
      tier: membership.tier,
      expiresAt: membership.expiresAt,
    };
  }

  /**
   * Check if user has enough credits
   */
  async hasEnoughCredits(userId: string, required: number = 1): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { userId },
    });

    if (!membership) {
      return required <= 100; // Free tier default
    }

    return membership.credits >= required;
  }
}

export const userService = new UserService();
