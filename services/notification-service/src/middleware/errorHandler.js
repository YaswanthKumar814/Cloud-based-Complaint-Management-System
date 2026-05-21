export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error('[error]', err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode >= 500 ? 'Internal server error' : err.message,
    },
  });
}
