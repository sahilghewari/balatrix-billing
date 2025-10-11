/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
    ip: req.ip,
  });

  // If it's an operational error (AppError), send appropriate response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Resource already exists',
      error: {
        code: 'DUPLICATE_RESOURCE',
        details: err.errors.map((e) => ({
          field: e.path,
          value: e.value,
        })),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Referenced resource not found',
      error: {
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: {
          table: err.table,
          constraint: err.constraint,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle Sequelize database errors
  if (err.name && err.name.startsWith('Sequelize')) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Database error occurred',
      error: {
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
      error: {
        code: 'TOKEN_EXPIRED',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: err.array(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid JSON format',
      error: {
        code: 'INVALID_JSON',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
};

/**
 * Handle 404 not found errors
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: {
      code: 'ROUTE_NOT_FOUND',
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
};

/**
 * Async error wrapper to catch promise rejections
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
};
