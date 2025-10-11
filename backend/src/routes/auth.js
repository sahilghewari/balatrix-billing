/**
 * Authentication Routes
 * Routes for user authentication and authorization
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiting');

/**
 * Public routes (no authentication required)
 */

// Register new user
router.post(
  '/register',
  registerLimiter,
  validate(schemas.register, 'body'),
  authController.register
);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Login
router.post(
  '/login',
  loginLimiter,
  validate(schemas.login, 'body'),
  authController.login
);

// Refresh access token
router.post(
  '/refresh',
  authLimiter,
  validate(schemas.refreshToken, 'body'),
  authController.refreshToken
);

// Forgot password
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(schemas.forgotPassword, 'body'),
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(schemas.resetPassword, 'body'),
  authController.resetPassword
);

/**
 * Protected routes (authentication required)
 */

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Logout
router.post('/logout', authenticate, authController.logout);

// Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAll);

// Change password
router.post(
  '/change-password',
  authenticate,
  validate(schemas.changePassword, 'body'),
  authController.changePassword
);

// MFA setup
router.post('/mfa/setup', authenticate, authController.setupMFA);

// MFA verify and enable
router.post(
  '/mfa/verify',
  authenticate,
  validate(schemas.verifyMFA, 'body'),
  authController.verifyMFA
);

// MFA disable
router.post('/mfa/disable', authenticate, authController.disableMFA);

// Get user sessions
router.get('/sessions', authenticate, authController.getSessions);

// Revoke specific session
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

module.exports = router;
