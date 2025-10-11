/**
 * Standardized API Response Handler
 * Ensures consistent response format across all API endpoints
 */

const { HTTP_STATUS } = require('./constants');
const logger = require('./logger');

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} pagination - Pagination metadata
 */
const successResponse = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, pagination = null) => {
  const response = {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
      version: process.env.API_VERSION || 'v1',
    },
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Application error code
 * @param {Object} errors - Detailed errors
 */
const errorResponse = (
  res,
  message = 'An error occurred',
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errorCode = null,
  errors = null
) => {
  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
      details: errors,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || null,
      version: process.env.API_VERSION || 'v1',
    },
  };

  // Log error
  logger.error('API Error Response', {
    statusCode,
    errorCode,
    message,
    requestId: res.locals.requestId,
  });

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Success message
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} paginationData - Pagination metadata
 * @param {string} message - Success message
 */
const paginatedResponse = (res, items, paginationData, message = 'Success') => {
  return successResponse(
    res,
    items,
    message,
    HTTP_STATUS.OK,
    {
      page: paginationData.page,
      limit: paginationData.limit,
      total: paginationData.total,
      pages: paginationData.pages,
      hasNext: paginationData.hasNext,
      hasPrev: paginationData.hasPrev,
    }
  );
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(
    res,
    'Validation failed',
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    'VALIDATION_ERROR',
    errors
  );
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorizedResponse = (res, message = 'Authentication required') => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

/**
 * Conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT');
};

/**
 * Too many requests response
 * @param {Object} res - Express response object
 * @param {number} retryAfter - Seconds until retry allowed
 */
const tooManyRequestsResponse = (res, retryAfter = 60) => {
  res.set('Retry-After', String(retryAfter));
  return errorResponse(
    res,
    'Too many requests. Please try again later.',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    'RATE_LIMIT_EXCEEDED',
    { retryAfter }
  );
};

/**
 * Service unavailable response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const serviceUnavailableResponse = (res, message = 'Service temporarily unavailable') => {
  return errorResponse(res, message, HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  tooManyRequestsResponse,
  serviceUnavailableResponse,
};
