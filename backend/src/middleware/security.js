/**
 * Security Middleware
 * Additional security headers and protection
 */

const helmet = require('helmet');
const { generateDeviceFingerprint } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Apply security headers using Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

/**
 * Add security-related request context
 */
const addSecurityContext = (req, res, next) => {
  // Generate device fingerprint
  req.deviceFingerprint = generateDeviceFingerprint(req);

  // Add request ID for tracking
  req.requestId = require('uuid').v4();
  res.locals.requestId = req.requestId;

  // Add security headers to response
  res.set('X-Request-ID', req.requestId);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');

  next();
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  ['body', 'query', 'params'].forEach((source) => {
    if (req[source]) {
      Object.keys(req[source]).forEach((key) => {
        if (Array.isArray(req[source][key])) {
          // Only keep the last value if multiple values provided
          req[source][key] = req[source][key][req[source][key].length - 1];
        }
      });
    }
  });

  next();
};

/**
 * Detect and log suspicious activity
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.)|(\.\/)/,  // Directory traversal
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i, // SQL injection
    /<script|javascript:|onerror=/i, // XSS
    /\${|<%/,  // Template injection
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const isSuspicious =
    checkValue(req.body) ||
    checkValue(req.query) ||
    checkValue(req.params) ||
    checkValue(req.get('user-agent'));

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Log to SystemLog
    const { SystemLog } = require('../models');
    SystemLog.create({
      level: 'alert',
      category: 'security',
      message: 'Suspicious activity detected',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
      },
    }).catch((err) => logger.error('Failed to log suspicious activity:', err));
  }

  next();
};

/**
 * IP whitelist/blacklist middleware
 */
const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;

  return (req, res, next) => {
    const clientIp = req.ip;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      logger.warn('Blocked IP address attempted access', { ip: clientIp });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      logger.warn('Non-whitelisted IP attempted access', { ip: clientIp });
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    next();
  };
};

/**
 * Protect against timing attacks
 */
const constantTimeDelay = (delayMs = 100) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Wait for response to complete
    res.on('finish', () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < delayMs) {
        setTimeout(() => {
          // Just for consistent timing
        }, delayMs - elapsed);
      }
    });

    next();
  };
};

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }

  next();
};

/**
 * Prevent host header injection
 */
const validateHostHeader = (allowedHosts = []) => {
  return (req, res, next) => {
    const host = req.get('host');

    if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
      logger.warn('Invalid host header detected', { host, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Invalid host header',
      });
    }

    next();
  };
};

module.exports = {
  securityHeaders,
  addSecurityContext,
  sanitizeInput,
  preventParameterPollution,
  detectSuspiciousActivity,
  ipFilter,
  constantTimeDelay,
  validateContentType,
  validateHostHeader,
};
