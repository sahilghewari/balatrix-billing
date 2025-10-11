/**
 * Integration Tests for Auth API
 */

const request = require('supertest');
const app = require('app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser } = require('../../helpers/testFixtures');
const { User } = require('../../../src/models');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+919876543210',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await createTestUser({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'Test@123',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for inactive user', async () => {
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      await user.update({ isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'Test@123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'Test@123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 without access token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken;

    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'OldPassword@123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'OldPassword@123',
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should change password with valid old password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'OldPassword@123',
          newPassword: 'NewPassword@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Try to login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword@123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return 400 for incorrect old password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without access token', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .send({
          oldPassword: 'OldPassword@123',
          newPassword: 'NewPassword@123',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        password: 'Test@123',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without access token', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });

    it('should return 401 with invalid access token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
