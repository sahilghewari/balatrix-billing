/**
 * Integration Tests for Subscription API
 */

const request = require('supertest');
const app = require('app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser, createTestRatePlan, createFullTestCustomer } = require('../../helpers/testFixtures');
const { Customer, Account } = require('../../../src/models');

describe('Subscription API Integration Tests', () => {
  let adminToken;
  let customerToken;
  let customerUser;
  let ratePlan;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    const adminUser = await createTestUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      });

    adminToken = adminLogin.body.data.tokens.accessToken;

    // Create customer user
    customerUser = await createTestUser({
      email: 'customer@example.com',
      password: 'Customer@123',
      role: 'customer',
    });

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'Customer@123',
      });

    customerToken = customerLogin.body.data.tokens.accessToken;

    // Create rate plan
    ratePlan = await createTestRatePlan();
  });

  describe('POST /api/subscriptions', () => {
    let customerId;
    let accountId;

    beforeEach(async () => {
      // Create customer profile
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        });

      customerId = customerResponse.body.data.id;

      // Create account
      const customer = await Customer.findByPk(customerId);
      const account = await Account.create({
        customerId: customer.id,
        accountNumber: `ACC-${Date.now()}`,
        accountType: 'prepaid',
        balance: 1000,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
      });

      accountId = account.id;
    });

    it('should create a new subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerId,
          accountId,
          ratePlanId: ratePlan.id,
          billingCycle: 'monthly',
          autoRenew: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerId).toBe(customerId);
      expect(response.body.data.ratePlanId).toBe(ratePlan.id);
      expect(response.body.data.status).toBe('active');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/subscriptions')
        .send({
          customerId,
          accountId,
          ratePlanId: ratePlan.id,
          billingCycle: 'monthly',
        })
        .expect(401);
    });

    it('should return 400 for invalid rate plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerId,
          accountId,
          ratePlanId: '00000000-0000-0000-0000-000000000000',
          billingCycle: 'monthly',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions', () => {
    beforeEach(async () => {
      // Create multiple subscriptions
      for (let i = 0; i < 3; i++) {
        await createFullTestCustomer();
      }
    });

    it('should list all subscriptions for admin', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/subscriptions?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.subscriptions.forEach(sub => {
        expect(sub.status).toBe('active');
      });
    });
  });

  describe('GET /api/subscriptions/:id', () => {
    let subscription;

    beforeEach(async () => {
      const testData = await createFullTestCustomer();
      subscription = testData.subscription;
    });

    it('should get subscription by ID', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(subscription.id);
    });

    it('should return 404 for non-existent subscription', async () => {
      await request(app)
        .get('/api/subscriptions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/subscriptions/:id/cancel', () => {
    let subscription;

    beforeEach(async () => {
      const testData = await createFullTestCustomer();
      subscription = testData.subscription;
    });

    it('should cancel subscription immediately', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscription.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          immediate: true,
          reason: 'Customer request',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancellationReason).toBe('Customer request');
    });

    it('should cancel subscription at period end', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscription.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          immediate: false,
          reason: 'Switching plans',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('POST /api/subscriptions/:id/suspend', () => {
    let subscription;

    beforeEach(async () => {
      const testData = await createFullTestCustomer();
      subscription = testData.subscription;
    });

    it('should suspend subscription for admin', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscription.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Payment failure',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post(`/api/subscriptions/${subscription.id}/suspend`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/subscriptions/:id/reactivate', () => {
    let subscription;

    beforeEach(async () => {
      const testData = await createFullTestCustomer({
        subscription: { status: 'suspended' },
      });
      subscription = testData.subscription;
    });

    it('should reactivate suspended subscription', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscription.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });
  });
});
