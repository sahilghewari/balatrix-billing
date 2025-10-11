/**
 * Unit Tests for Auth Service
 */

const authService = require('../../../src/services/authService');
const { User, RefreshToken } = require('../../../src/models');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser } = require('../../helpers/testFixtures');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+919876543210',
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined(); // Password should not be returned
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should hash the password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authService.register(userData);

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.password).not.toBe('Test@123');
      const isValid = await bcrypt.compare('Test@123', user.password);
      expect(isValid).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authService.register(userData);

      const duplicateUser = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(authService.register(duplicateUser)).rejects.toThrow();
    });
  });

  describe('login', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        password: 'Test@123',
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test@123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(user.id);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        })
      ).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Test@123',
        })
      ).rejects.toThrow();
    });

    it('should throw error for inactive user', async () => {
      await user.update({ isActive: false });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Test@123',
        })
      ).rejects.toThrow();
    });

    it('should update last login timestamp', async () => {
      const oldLastLogin = user.lastLoginAt;

      await authService.login({
        email: 'test@example.com',
        password: 'Test@123',
        ipAddress: '192.168.1.1',
      });

      await user.reload();
      expect(user.lastLoginAt).not.toBe(oldLastLogin);
      expect(user.lastLoginIp).toBe('192.168.1.1');
    });
  });

  describe('refreshAccessToken', () => {
    let user;
    let refreshToken;

    beforeEach(async () => {
      user = await createTestUser();
      const result = await authService.login({
        email: user.email,
        password: 'Test@123',
      });
      refreshToken = result.tokens.refreshToken;
    });

    it('should generate new access token with valid refresh token', async () => {
      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      
      // Decode and verify token
      const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.id);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error for revoked refresh token', async () => {
      // Revoke the token
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
      });
      await tokenRecord.update({ isRevoked: true });

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    let user;
    let refreshToken;

    beforeEach(async () => {
      user = await createTestUser();
      const result = await authService.login({
        email: user.email,
        password: 'Test@123',
      });
      refreshToken = result.tokens.refreshToken;
    });

    it('should revoke refresh token on logout', async () => {
      await authService.logout(refreshToken);

      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
      });

      expect(tokenRecord.isRevoked).toBe(true);
    });
  });

  describe('changePassword', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        password: 'OldPassword@123',
      });
    });

    it('should change password with valid old password', async () => {
      await authService.changePassword(user.id, {
        oldPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });

      // Try to login with new password
      const result = await authService.login({
        email: user.email,
        password: 'NewPassword@123',
      });

      expect(result.user.id).toBe(user.id);
    });

    it('should throw error for incorrect old password', async () => {
      await expect(
        authService.changePassword(user.id, {
          oldPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
        })
      ).rejects.toThrow();
    });

    it('should update passwordChangedAt timestamp', async () => {
      await authService.changePassword(user.id, {
        oldPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });

      await user.reload();
      expect(user.passwordChangedAt).toBeDefined();
    });
  });

  describe('generateTokens', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    it('should generate valid JWT tokens', async () => {
      const tokens = await authService.generateTokens(user);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // Verify access token
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should store refresh token in database', async () => {
      const tokens = await authService.generateTokens(user);

      const tokenRecord = await RefreshToken.findOne({
        where: { token: tokens.refreshToken },
      });

      expect(tokenRecord).toBeDefined();
      expect(tokenRecord.userId).toBe(user.id);
      expect(tokenRecord.isRevoked).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        isEmailVerified: false,
      });
    });

    it('should verify user email', async () => {
      await authService.verifyEmail(user.id);

      await user.reload();
      expect(user.isEmailVerified).toBe(true);
    });
  });
});
