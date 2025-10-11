/**
 * Rate Limiting Middleware
 * Protect API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/redis');
const { tooManyRequestsResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Create rate limiter with Redis store
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      return tooManyRequestsResponse(res, options.windowMs / 1000);
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.userId || req.ip;
    },
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * General API rate limiter
 * Development: 1000 requests per 15 minutes
 * Production: 100 requests per 15 minutes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Strict rate limiter for authentication endpoints
 * Development: 50 requests per 15 minutes
 * Production: 5 requests per 15 minutes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

/**
 * Login rate limiter
 * Development: 50 login attempts per 15 minutes per IP
 * Production: 5 login attempts per 15 minutes per IP
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.',
  keyGenerator: (req) => {
    return `login:${req.body.email || req.ip}`;
  },
});

/**
 * Registration rate limiter
 * Development: 50 registrations per hour per IP
 * Production: 3 registrations per hour per IP
 */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 3 : 50,
  message: 'Too many accounts created from this IP, please try again later.',
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests, please try again later.',
  keyGenerator: (req) => {
    return `reset:${req.body.email || req.ip}`;
  },
});

/**
 * CDR submission rate limiter
 * 1000 requests per minute
 */
const cdrLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'CDR submission rate limit exceeded.',
});

/**
 * Payment rate limiter
 * 10 payment attempts per hour
 */
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later.',
});

/**
 * Custom rate limiter for specific user/IP
 */
const customRateLimiter = async (req, res, next) => {
  try {
    const key = `rate:${req.userId || req.ip}:${req.path}`;
    const limit = 100;
    const window = 60; // 1 minute

    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, window);
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = await redisClient.ttl(key);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': Date.now() + resetTime * 1000,
    });

    if (current > limit) {
      logger.warn('Custom rate limit exceeded', {
        key,
        current,
        limit,
        userId: req.userId,
        ip: req.ip,
      });
      return tooManyRequestsResponse(res, resetTime);
    }

    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    // Fail open - don't block request if rate limiter fails
    next();
  }
};

/**
 * Dynamic rate limiter based on user tier
 */
const dynamicRateLimiter = (baseLimits = {}) => {
  return async (req, res, next) => {
    try {
      // Default limits
      let windowMs = baseLimits.windowMs || 15 * 60 * 1000;
      let max = baseLimits.max || 100;

      // Increase limits for authenticated users
      if (req.user) {
        max = max * 2;

        // Premium users get even higher limits
        if (req.user.role === 'premium') {
          max = max * 2;
        }
      }

      const limiter = createRateLimiter({ windowMs, max });
      return limiter(req, res, next);
    } catch (error) {
      logger.error('Dynamic rate limiter error:', error);
      next();
    }
  };
};

/**
 * Rate limit by endpoint and method
 */
const endpointRateLimiter = (limits = {}) => {
  return (req, res, next) => {
    const key = `${req.method}:${req.path}`;
    const limit = limits[key] || limits.default;

    if (!limit) {
      return next();
    }

    const limiter = createRateLimiter(limit);
    return limiter(req, res, next);
  };
};

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  cdrLimiter,
  paymentLimiter,
  customRateLimiter,
  dynamicRateLimiter,
  endpointRateLimiter,
  createRateLimiter,
};
