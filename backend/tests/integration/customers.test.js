/**
 * Integration Tests for Customer API
 */

const request = require('supertest');
const app = require('app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser } = require('../../helpers/testFixtures');

describe('Customer API Integration Tests', () => {
  let adminToken;
  let customerToken;
  let adminUser;
  let customerUser;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    adminUser = await createTestUser({
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
  });

  describe('POST /api/customers', () => {
    it('should create a new customer profile', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          companyName: 'Test Company',
          businessType: 'company',
          gstin: '29ABCDE1234F1Z5',
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companyName).toBe('Test Company');
      expect(response.body.data.userId).toBe(customerUser.id);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/customers')
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          billingAddress: '123 Test Street',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // Create some customers
      for (let i = 0; i < 5; i++) {
        const user = await createTestUser({
          email: `customer${i}@example.com`,
          role: 'customer',
        });
        
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: `customer${i}@example.com`,
            password: 'Test@123',
          });

        await request(app)
          .post('/api/customers')
          .set('Authorization', `Bearer ${loginResponse.body.data.tokens.accessToken}`)
          .send({
            billingAddress: `Address ${i}`,
            billingCity: 'Bangalore',
            billingState: 'Karnataka',
            billingCountry: 'India',
            billingPincode: '560001',
          });
      }
    });

    it('should list all customers for admin', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customers.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/customers?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.customers).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('GET /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        });

      customerId = response.body.data.id;
    });

    it('should get customer by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customerId);
    });

    it('should get own customer profile', async () => {
      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customerId);
    });

    it('should return 404 for non-existent customer', async () => {
      await request(app)
        .get('/api/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          companyName: 'Old Company',
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        });

      customerId = response.body.data.id;
    });

    it('should update customer profile', async () => {
      const response = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          companyName: 'New Company',
          gstin: '29ABCDE1234F1Z5',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companyName).toBe('New Company');
      expect(response.body.data.gstin).toBe('29ABCDE1234F1Z5');
    });

    it('should return 403 when updating other customer profile', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        password: 'Other@123',
        role: 'customer',
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Other@123',
        });

      await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${otherLogin.body.data.tokens.accessToken}`)
        .send({
          companyName: 'Hacked Company',
        })
        .expect(403);
    });
  });

  describe('POST /api/customers/:id/suspend', () => {
    let customerId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        });

      customerId = response.body.data.id;
    });

    it('should suspend customer for admin', async () => {
      const response = await request(app)
        .post(`/api/customers/${customerId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post(`/api/customers/${customerId}/suspend`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/customers/:id/activate', () => {
    let customerId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        });

      customerId = response.body.data.id;

      // Suspend first
      await request(app)
        .post(`/api/customers/${customerId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should activate suspended customer for admin', async () => {
      const response = await request(app)
        .post(`/api/customers/${customerId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post(`/api/customers/${customerId}/activate`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
