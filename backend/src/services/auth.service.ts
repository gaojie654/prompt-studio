import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import config from '../config';
import { AppError } from '../utils/AppError';

const SALT_ROUNDS = 10;

export interface RegisterInput {
  phone: string;
  password: string;
  nickname?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    phone: string;
    nickname: string | null;
    balance: number;
    member_type: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a password using bcryptjs
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access token (JWT)
 */
const generateAccessToken = (userId: string, phone: string): string => {
  return jwt.sign(
    { userId, phone },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generate refresh token and store in DB
 */
const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Parse refresh expiry from config
  const expiresInMs = parseExpiresIn(config.jwt.refreshExpiresIn);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

/**
 * Parse duration string like "30d", "7d", "1h" into milliseconds
 */
const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const units: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  return value * units[unit];
};

/**
 * Build safe user object (no password)
 */
const safeUser = (user: { id: string; phone: string; nickname: string | null; balance: number; memberType: string }) => ({
  id: user.id,
  phone: user.phone,
  nickname: user.nickname,
  balance: user.balance,
  member_type: user.memberType,
});

/**
 * Register a new user
 */
export const register = async (input: RegisterInput): Promise<AuthResult> => {
  // Check if phone already exists
  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });

  if (existing) {
    throw new AppError('手机号已存在', 400, 'PHONE_EXISTS');
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create user with FREE membership tier, 0 balance
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      password: hashedPassword,
      nickname: input.nickname || null,
      balance: 0,
      memberType: 'FREE',
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.phone);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: safeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
export const login = async (input: LoginInput): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({
    where: { phone: input.phone },
  });

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const isValid = await verifyPassword(input.password, user.password);

  if (!isValid) {
    throw new AppError('密码错误', 401, 'INVALID_PASSWORD');
  }

  if (!user.isActive) {
    throw new AppError('账号已被禁用', 403, 'ACCOUNT_DISABLED');
  }

  const accessToken = generateAccessToken(user.id, user.phone);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: safeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh tokens using a valid refresh token
 */
export const refreshTokens = async (refreshToken: string): Promise<TokenPair> => {
  // First verify the JWT itself
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.secret) as jwt.JwtPayload;
  } catch {
    throw new AppError('无效的刷新令牌', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('无效的刷新令牌', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Check token exists in DB and not expired
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError('刷新令牌不存在或已失效', 401, 'REFRESH_TOKEN_NOT_FOUND');
  }

  if (storedToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('刷新令牌已过期', 401, 'REFRESH_TOKEN_EXPIRED');
  }

  // Delete old refresh token (rotation)
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  // Generate new tokens
  const newAccessToken = generateAccessToken(storedToken.userId, storedToken.user.phone);
  const newRefreshToken = await generateRefreshToken(storedToken.userId);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout: revoke a specific refresh token
 */
export const logout = async (refreshToken: string): Promise<void> => {
  try {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
  } catch {
    // Token not found is fine for logout
  }
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
