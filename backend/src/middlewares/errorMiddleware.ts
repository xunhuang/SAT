import { Request, Response, NextFunction } from 'express';

// Interface for application errors
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Error handler middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const isOperational = err.isOperational || false;

  // Log the error
  console.error(`[Error] ${req.method} ${req.path}: ${err.message}`);
  if (!isOperational) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found handler middleware
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

export default {
  errorHandler,
  notFoundHandler,
};