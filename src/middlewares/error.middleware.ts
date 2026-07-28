import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`[ERROR] [${req.method} ${req.url}]: ${error.message} \nStack: ${error.stack}`);

  // 1. Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique key violation
    if (error.code === 'P2002') {
      const targets = (error.meta?.target as string[]) || [];
      return res.status(409).json({
        success: false,
        message: `Conflict: Database constraint violation on field(s): ${targets.join(', ')}`,
      });
    }

    // Record not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: error.meta?.cause || 'Record not found in the database.',
      });
    }
  }

  // 3. Fallback General Errors
  const status = (error as any).status || 500;
  const message = error.message || 'Internal Server Error';

  return res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message,
  });
};
export default errorHandler;
