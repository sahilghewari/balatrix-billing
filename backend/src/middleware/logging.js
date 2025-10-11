/**
 * Request Logging Middleware
 * Log all HTTP requests
 */

const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.userId || 'anonymous';
});

// Custom token for request ID
morgan.token('request-id', (req, res) => {
  return res.locals.requestId || '-';
});

// Custom morgan format
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms - :request-id'
  : ':method :url :status :response-time ms - :res[content-length] - :user-id - :request-id';

// Morgan stream to Winston
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Morgan middleware
const requestLogger = morgan(morganFormat, { stream: morganStream });

/**
 * Custom request logger with detailed information
 */
const detailedRequestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId: res.locals.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId: res.locals.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId,
    });
  });

  next();
};

/**
 * Log only errors (4xx and 5xx responses)
 */
const errorRequestLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req, res) => res.statusCode < 400,
});

module.exports = {
  requestLogger,
  detailedRequestLogger,
  errorRequestLogger,
};
