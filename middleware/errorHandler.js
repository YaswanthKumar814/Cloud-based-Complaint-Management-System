import { AppError } from '../utils/AppError.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof AppError || err.isOperational;

  if (!isOperational && statusCode === 500) {
    console.error('[error]', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: err.stack,
    });
  }

  const response = {
    success: false,
    error: {
      message: isOperational ? err.message : 'Internal server error',
    },
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (!isProduction && !isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
