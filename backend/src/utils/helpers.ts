import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: object, expiresIn: string = config.jwt.expiresIn): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwt.secret);
};

export const generateOrderNo = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD${timestamp}${random}`.toUpperCase();
};
