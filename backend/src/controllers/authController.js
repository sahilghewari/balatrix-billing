/**
 * Authentication Controller
 * Handle authentication-related HTTP requests
 */

const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  errorResponse,
} = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(
    req.body,
    req.ip,
    req.get('user-agent')
  );

  return createdResponse(res, result.user, result.message);
});

/**
 * Verify email address
 * GET /api/auth/verify-email/:token
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await authService.verifyEmail(token);

  return successResponse(res, null, result.message);
});

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password, mfaCode } = req.body;

  const result = await authService.login(
    email,
    password,
    mfaCode,
    req.ip,
    req.get('user-agent')
  );

  // If MFA is required, return with requiresMfa flag
  if (result.requiresMfa) {
    return successResponse(res, { requiresMfa: true }, result.message);
  }

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return successResponse(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    },
    'Login successful'
  );
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return errorResponse(res, 'Refresh token is required', 400);
  }

  const tokens = await authService.refreshAccessToken(
    refreshToken,
    req.ip,
    req.get('user-agent')
  );

  // Update refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(
    res,
    {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    'Token refreshed successfully'
  );
});

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken, req.userId);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  return successResponse(res, null, 'Logged out successfully');
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.userId);

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  return successResponse(res, null, 'Logged out from all devices successfully');
});

/**
 * Setup MFA
 * POST /api/auth/mfa/setup
 */
exports.setupMFA = asyncHandler(async (req, res) => {
  const result = await authService.setupMFA(req.userId);

  return successResponse(res, result, result.message);
});

/**
 * Verify and enable MFA
 * POST /api/auth/mfa/verify
 */
exports.verifyMFA = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const result = await authService.verifyAndEnableMFA(req.userId, code);

  return successResponse(res, result, result.message);
});

/**
 * Disable MFA
 * POST /api/auth/mfa/disable
 */
exports.disableMFA = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const result = await authService.disableMFA(req.userId, password);

  return successResponse(res, null, result.message);
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email, req.ip);

  return successResponse(res, null, result.message);
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password, req.ip);

  return successResponse(res, null, result.message);
});

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(
    req.userId,
    currentPassword,
    newPassword,
    req.ip
  );

  return successResponse(res, null, result.message);
});

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const { User, Customer } = require('../models');

  const user = await User.findByPk(req.userId, {
    include: [
      {
        model: Customer,
        as: 'customer',
        required: false,
      },
    ],
  });

  return successResponse(res, user.toJSON(), 'User retrieved successfully');
});

/**
 * Get user sessions
 * GET /api/auth/sessions
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserSessions(req.userId);

  return successResponse(res, sessions, 'Sessions retrieved successfully');
});

/**
 * Revoke session
 * DELETE /api/auth/sessions/:sessionId
 */
exports.revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await authService.revokeSession(req.userId, sessionId);

  return successResponse(res, null, result.message);
});

module.exports = exports;
