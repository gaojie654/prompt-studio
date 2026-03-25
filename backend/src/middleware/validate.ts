import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

// Extend Express Request to include validated data
declare global {
  namespace Express {
    interface Request {
      _validated?: {
        body?: unknown;
        query?: Record<string, unknown>;
        params?: Record<string, string>;
      };
    }
  }
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Store validated data for use in handlers
      req._validated = result as Express.Request['_validated'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new AppError(message, 400, 'VALIDATION_ERROR'));
      }
      next(error);
    }
  };
};
