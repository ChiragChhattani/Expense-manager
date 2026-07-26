/**
 * Custom API error class with HTTP status code support
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";
  }
}

/**
 * Async wrapper to eliminate try/catch boilerplate in controllers
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Express centralized error-handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, errors } = err;

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(", ")} already exists.`;
  }

  // Prisma record not found
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${err.name}] ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || [],
  });
};

module.exports = { ApiError, asyncHandler, errorHandler };
