const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const { LOG_LEVELS } = require('./constants');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// File transport for all logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// File transport for error logs
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.LOG_LEVEL || 'info',
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  format: logFormat,
  defaultMeta: {
    service: process.env.APP_NAME || 'telecom-billing',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [fileRotateTransport, errorFileRotateTransport],
  exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

// Create child logger with metadata
logger.child = (metadata) => {
  return logger.child(metadata);
};

// Log uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
  })
);

logger.rejections.handle(
  new winston.transports.DailyRotateFile({
    filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
  })
);

// Helper methods for structured logging
logger.logRequest = (req, message = 'HTTP Request') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
  });
};

logger.logResponse = (req, res, duration, message = 'HTTP Response') => {
  const logLevel = res.statusCode >= 400 ? 'error' : 'info';
  logger[logLevel](message, {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.userId,
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...context,
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

logger.logBusiness = (event, details = {}) => {
  logger.info('Business Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

module.exports = logger;
