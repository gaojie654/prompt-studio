import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (config.nodeEnv !== 'production') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    code,
    message: err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
};
