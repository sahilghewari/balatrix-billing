/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/responseHandler');
const { TokenInvalidError, TokenExpiredError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'mfaSecret'] },
      });

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      if (!user.isActive) {
        return unauthorizedResponse(res, 'Account is inactive');
      }

      if (user.isAccountLocked()) {
        return unauthorizedResponse(res, 'Account is locked');
      }

      // Attach user to request
      req.user = user;
      req.userId = user.userId;
      req.userRole = user.role;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return unauthorizedResponse(res, 'Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        return unauthorizedResponse(res, 'Invalid token');
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return unauthorizedResponse(res, 'Authentication failed');
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'mfaSecret'] },
      });

      if (user && user.isActive) {
        req.user = user;
        req.userId = user.userId;
        req.userRole = user.role;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    if (!roles.includes(req.userRole)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.userId,
        userRole: req.userRole,
        requiredRoles: roles,
      });
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Require customer ownership or admin
 */
const requireCustomerAccess = async (req, res, next) => {
  try {
    const customerId = req.params.customerId || req.body.customerId;

    if (!customerId) {
      return forbiddenResponse(res, 'Customer ID required');
    }

    // Admin and super_admin can access all customers
    if (['super_admin', 'admin'].includes(req.userRole)) {
      return next();
    }

    // Check if user owns this customer account
    const { Customer } = require('../models');
    const customer = await Customer.findOne({
      where: {
        customerId,
        userId: req.userId,
      },
    });

    if (!customer) {
      return forbiddenResponse(res, 'Access denied to this customer account');
    }

    req.customer = customer;
    next();
  } catch (error) {
    logger.error('Customer access check error:', error);
    return forbiddenResponse(res, 'Access verification failed');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return unauthorizedResponse(res, 'Refresh token required');
    }

    // Verify token signature
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Check if token exists in database
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
        include: [{ model: User, as: 'user' }],
      });

      if (!tokenRecord) {
        return unauthorizedResponse(res, 'Invalid refresh token');
      }

      if (!tokenRecord.isValid()) {
        return unauthorizedResponse(res, 'Refresh token is expired or revoked');
      }

      if (tokenRecord.userId !== decoded.userId) {
        return unauthorizedResponse(res, 'Token mismatch');
      }

      req.refreshTokenRecord = tokenRecord;
      req.user = tokenRecord.user;
      req.userId = tokenRecord.userId;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return unauthorizedResponse(res, 'Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        return unauthorizedResponse(res, 'Invalid refresh token');
      }
      throw error;
    }
  } catch (error) {
    logger.error('Refresh token verification error:', error);
    return unauthorizedResponse(res, 'Token verification failed');
  }
};

/**
 * Check if account is locked
 */
const checkAccountLocked = async (req, res, next) => {
  try {
    if (req.user && req.user.isAccountLocked()) {
      const lockedUntil = req.user.accountLockedUntil;
      const remainingTime = Math.ceil((lockedUntil - new Date()) / 1000 / 60);

      logger.warn('Login attempt on locked account', {
        userId: req.user.userId,
        email: req.user.email,
      });

      return unauthorizedResponse(res, `Account is locked. Try again in ${remainingTime} minutes.`);
    }

    next();
  } catch (error) {
    logger.error('Account lock check error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireCustomerAccess,
  verifyRefreshToken,
  checkAccountLocked,
};
