import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from './ApiError';

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object' && 'name' in err) {
    const e = err as MongooseValidationError & { name: string };
    if (e.name === 'ValidationError' && e.errors) {
      statusCode = 400;
      const messages = Object.values(e.errors).map((v) => v.message);
      message = messages[0] || 'Validation failed';
      details = messages;
    } else if (e.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier format';
    } else if (e.code === 11000 && e.keyValue) {
      statusCode = 409;
      const field = Object.keys(e.keyValue)[0];
      message = `A record with this ${field} already exists`;
    }
  }

  if (statusCode >= 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { error: details } : { error: statusCode >= 500 ? String(err instanceof Error ? err.message : err) : undefined }),
  });
};
