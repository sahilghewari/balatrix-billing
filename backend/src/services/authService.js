/**
 * Authentication Service
 * Business logic for user authentication and authorization
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const {
  User,
  RefreshToken,
  LoginAttempt,
  Customer,
  // SystemLog, // Table doesn't exist in database
} = require('../models');
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} = require('../utils/errors');
const { SECURITY, USER_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');
const { generateDeviceFingerprint, generateReferenceNumber } = require('../utils/helpers');
// const { redisClient } = require('../config/redis');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData, ipAddress, userAgent) {
    const { email, password, firstName, lastName, phoneNumber, role = 'customer' } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Generate username from email
    const username = email.split('@')[0] + '_' + Date.now().toString(36);

    // Create user (password will be hashed by model hook)
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      isActive: true,
      isEmailVerified: false,
    });

    // Log registration
    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress,
    });

    // SystemLog table doesn't exist in database - commenting out for now
    // await SystemLog.create({
    //   level: 'info',
    //   category: 'auth',
    //   message: 'User registered',
    //   userId: user.id,
    //   ipAddress,
    //   userAgent,
    //   metadata: { email: user.email, role: user.role },
    // });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);

    return {
      user: user.toJSON(),
      message: 'Registration successful. Please verify your email.',
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token) {
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    if (user.emailVerificationExpiry < new Date()) {
      throw new ValidationError('Verification token has expired');
    }

    // Update user email verification status
    user.isActive = true;
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    logger.info('Email verified', { userId: user.id, email: user.email });

    return { message: 'Email verified successfully' };
  }

  /**
   * Login user
   */
  async login(email, password, mfaCode, ipAddress, userAgent) {
    const deviceFingerprint = generateDeviceFingerprint({
      ip: ipAddress,
      headers: { 'user-agent': userAgent },
    });

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false,
        },
      ],
    });

    // Log login attempt
    const logAttempt = async (success, reason = null) => {
      await LoginAttempt.create({
        userId: user?.id,
        email,
        ipAddress,
        userAgent,
        deviceFingerprint,
        status: success ? 'success' : 'failed',
        failureReason: reason,
      });
    };

    if (!user) {
      await logAttempt(false, 'user_not_found');
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      await logAttempt(false, 'account_locked');
      throw new AuthenticationError(
        `Account is locked due to too many failed login attempts. Please try again after ${Math.ceil(
          (user.accountLockedUntil - new Date()) / 60000
        )} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementFailedLoginAttempts();
      await logAttempt(false, 'invalid_password');
      
      const remainingAttempts = SECURITY.MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;
      if (remainingAttempts > 0) {
        throw new AuthenticationError(
          `Invalid email or password. ${remainingAttempts} attempts remaining.`
        );
      } else {
        throw new AuthenticationError(
          'Account has been locked due to too many failed login attempts.'
        );
      }
    }

    // Check if user is active
    if (!user.isActive) {
      await logAttempt(false, 'account_inactive');
      throw new AuthenticationError('Account is not active. Please contact support.');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        // Log as mfa_required status
        await LoginAttempt.create({
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          deviceFingerprint,
          status: 'mfa_required',
          failureReason: 'mfa_required',
        });
        return {
          requiresMfa: true,
          message: 'MFA code required',
        };
      }

      const isMfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2, // Allow 2 time steps before/after
      });

      if (!isMfaValid) {
        await user.incrementFailedLoginAttempts();
        // Log as mfa_failed status
        await LoginAttempt.create({
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          deviceFingerprint,
          status: 'mfa_failed',
          failureReason: 'invalid_mfa',
        });
        throw new AuthenticationError('Invalid MFA code');
      }
    }

    // Reset failed login attempts
    await user.resetFailedLoginAttempts();

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user, deviceFingerprint, ipAddress, userAgent);

    // Log successful login
    await logAttempt(true);
    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      ipAddress,
    });

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user, deviceFingerprint, ipAddress, userAgent) {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || '15m',
      }
    );

    // Generate refresh token (long-lived)
    const refreshTokenString = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenString,
      deviceFingerprint,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshTokenString, ipAddress, userAgent) {
    const deviceFingerprint = generateDeviceFingerprint({
      ip: ipAddress,
      headers: { 'user-agent': userAgent },
    });

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({
      where: {
        token: refreshTokenString,
        userId: decoded.userId,
        revoked: false,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token not found or has been revoked');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token has expired');
    }

    // Check device fingerprint for security
    if (refreshToken.deviceFingerprint !== deviceFingerprint) {
      logger.warn('Device fingerprint mismatch during token refresh', {
        userId: decoded.userId,
        storedFingerprint: refreshToken.deviceFingerprint,
        currentFingerprint: deviceFingerprint,
      });
      // Don't throw error, but log for monitoring
    }

    const user = refreshToken.user;

    if (!user || !user.isActive) {
      throw new AuthenticationError('User account is not active');
    }

    // Revoke old refresh token
    refreshToken.revoked = true;
    await refreshToken.save();

    // Generate new tokens (token rotation)
    const tokens = await this.generateTokens(user, deviceFingerprint, ipAddress, userAgent);

    logger.info('Access token refreshed', {
      userId: user.id,
      ipAddress,
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(refreshTokenString, userId) {
    // Revoke refresh token
    await RefreshToken.update(
      { revoked: true },
      {
        where: {
          token: refreshTokenString,
          userId,
        },
      }
    );

    logger.info('User logged out', { userId });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId) {
    // Revoke all refresh tokens for user
    await RefreshToken.update(
      { revoked: true },
      {
        where: {
          userId,
          revoked: false,
        },
      }
    );

    logger.info('User logged out from all devices', { userId });

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Setup MFA (Multi-Factor Authentication)
   */
  async setupMFA(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.mfaEnabled) {
      throw new ValidationError('MFA is already enabled for this account');
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `Balatrix Telecom (${user.email})`,
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store secret temporarily (not enabled yet)
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = backupCodes;
    await user.save();

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    logger.info('MFA setup initiated', { userId: user.id });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable MFA',
    };
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMFA(userId, code) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.mfaEnabled) {
      throw new ValidationError('MFA is already enabled for this account');
    }

    if (!user.mfaSecret) {
      throw new ValidationError('MFA setup not initiated. Please start MFA setup first.');
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new AuthenticationError('Invalid MFA code');
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    logger.info('MFA enabled', { userId: user.id });

    // await SystemLog.create({
    //   level: 'info',
    //   category: 'security',
    //   message: 'MFA enabled',
    //   userId: user.id,
    //   metadata: { email: user.email },
    // });

    return {
      message: 'MFA enabled successfully',
      backupCodes: user.mfaBackupCodes,
    };
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId, password) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.mfaEnabled) {
      throw new ValidationError('MFA is not enabled for this account');
    }

    // Verify password for security
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid password');
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaBackupCodes = null;
    await user.save();

    logger.warn('MFA disabled', { userId: user.id });

    // await SystemLog.create({
    //   level: 'warning',
    //   category: 'security',
    //   message: 'MFA disabled',
    //   userId: user.id,
    //   metadata: { email: user.email },
    // });

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Forgot password - send reset link
   */
  async forgotPassword(email, ipAddress) {
    const user = await User.findOne({ where: { email } });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email, ipAddress });
      return {
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // TODO: Send password reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info('Password reset requested', { userId: user.id, email, ipAddress });

    // await SystemLog.create({
    //   level: 'info',
    //   category: 'auth',
    //   message: 'Password reset requested',
    //   userId: user.id,
    //   ipAddress,
    //   metadata: { email },
    // });

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
      resetToken, // TODO: Remove this in production - only for development
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword, ipAddress) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: resetTokenHash,
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new ValidationError('Reset token has expired');
    }

    // Update password (will be hashed by model hook)
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { revoked: true },
      {
        where: {
          userId: user.id,
          revoked: false,
        },
      }
    );

    logger.info('Password reset successful', { userId: user.id, ipAddress });

    // await SystemLog.create({
    //   level: 'info',
    //   category: 'security',
    //   message: 'Password reset',
    //   userId: user.id,
    //   ipAddress,
    //   metadata: { email: user.email },
    // });

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword, ipAddress) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens except current session
    await RefreshToken.update(
      { revoked: true },
      {
        where: {
          userId: user.id,
          revoked: false,
        },
      }
    );

    logger.info('Password changed', { userId: user.id, ipAddress });

    // await SystemLog.create({
    //   level: 'info',
    //   category: 'security',
    //   message: 'Password changed',
    //   userId: user.id,
    //   ipAddress,
    //   metadata: { email: user.email },
    // });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user sessions (active refresh tokens)
   */
  async getUserSessions(userId) {
    const sessions = await RefreshToken.findAll({
      where: {
        userId,
        revoked: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceFingerprint: session.deviceFingerprint,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId, sessionId) {
    const session = await RefreshToken.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    session.revoked = true;
    await session.save();

    logger.info('Session revoked', { userId, sessionId });

    return { message: 'Session revoked successfully' };
  }
}

module.exports = new AuthService();
