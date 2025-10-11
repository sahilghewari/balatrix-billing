/**
 * Unit Tests for Customer Service
 */

const customerService = require('../../../src/services/customerService');
const { Customer, User, Account } = require('../../../src/models');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser } = require('../../helpers/testFixtures');

describe('Customer Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createCustomer', () => {
    it('should create a new customer with valid data', async () => {
      const user = await createTestUser({ role: 'customer' });

      const customerData = {
        userId: user.id,
        companyName: 'Test Company',
        businessType: 'company',
        gstin: '29ABCDE1234F1Z5',
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
      };

      const customer = await customerService.createCustomer(customerData);

      expect(customer).toBeDefined();
      expect(customer.userId).toBe(user.id);
      expect(customer.companyName).toBe('Test Company');
      expect(customer.businessType).toBe('company');
      expect(customer.status).toBe('active');
    });

    it('should throw error when user does not exist', async () => {
      const customerData = {
        userId: '00000000-0000-0000-0000-000000000000',
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
      };

      await expect(customerService.createCustomer(customerData)).rejects.toThrow();
    });

    it('should throw error when customer already exists for user', async () => {
      const user = await createTestUser({ role: 'customer' });

      const customerData = {
        userId: user.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
      };

      await customerService.createCustomer(customerData);

      // Try to create duplicate customer
      await expect(customerService.createCustomer(customerData)).rejects.toThrow();
    });
  });

  describe('getCustomerById', () => {
    it('should return customer with associated data', async () => {
      const user = await createTestUser({ role: 'customer' });
      const customer = await Customer.create({
        userId: user.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
      });

      const result = await customerService.getCustomerById(customer.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(customer.id);
      expect(result.User).toBeDefined();
      expect(result.User.id).toBe(user.id);
    });

    it('should return null for non-existent customer', async () => {
      const result = await customerService.getCustomerById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer data', async () => {
      const user = await createTestUser({ role: 'customer' });
      const customer = await Customer.create({
        userId: user.id,
        companyName: 'Old Company',
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
      });

      const updateData = {
        companyName: 'New Company',
        gstin: '29ABCDE1234F1Z5',
      };

      const updated = await customerService.updateCustomer(customer.id, updateData);

      expect(updated.companyName).toBe('New Company');
      expect(updated.gstin).toBe('29ABCDE1234F1Z5');
      expect(updated.billingCity).toBe('Bangalore'); // Unchanged
    });

    it('should throw error when updating non-existent customer', async () => {
      await expect(
        customerService.updateCustomer('00000000-0000-0000-0000-000000000000', {
          companyName: 'New Company',
        })
      ).rejects.toThrow();
    });
  });

  describe('getCustomerByUserId', () => {
    it('should return customer for given user ID', async () => {
      const user = await createTestUser({ role: 'customer' });
      const customer = await Customer.create({
        userId: user.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
      });

      const result = await customerService.getCustomerByUserId(user.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(customer.id);
      expect(result.userId).toBe(user.id);
    });

    it('should return null for user without customer profile', async () => {
      const user = await createTestUser({ role: 'admin' });

      const result = await customerService.getCustomerByUserId(user.id);

      expect(result).toBeNull();
    });
  });

  describe('listCustomers', () => {
    it('should return paginated list of customers', async () => {
      // Create multiple customers
      for (let i = 0; i < 5; i++) {
        const user = await createTestUser();
        await Customer.create({
          userId: user.id,
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
          status: 'active',
        });
      }

      const result = await customerService.listCustomers({
        page: 1,
        limit: 3,
      });

      expect(result.customers).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter customers by status', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await Customer.create({
        userId: user1.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
      });

      await Customer.create({
        userId: user2.id,
        billingAddress: '456 Test Avenue',
        billingCity: 'Mumbai',
        billingState: 'Maharashtra',
        billingCountry: 'India',
        billingPincode: '400001',
        status: 'suspended',
      });

      const result = await customerService.listCustomers({
        page: 1,
        limit: 10,
        status: 'active',
      });

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].status).toBe('active');
    });
  });

  describe('suspendCustomer', () => {
    it('should suspend active customer', async () => {
      const user = await createTestUser();
      const customer = await Customer.create({
        userId: user.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
      });

      const result = await customerService.suspendCustomer(customer.id);

      expect(result.status).toBe('suspended');
    });
  });

  describe('activateCustomer', () => {
    it('should activate suspended customer', async () => {
      const user = await createTestUser();
      const customer = await Customer.create({
        userId: user.id,
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'suspended',
      });

      const result = await customerService.activateCustomer(customer.id);

      expect(result.status).toBe('active');
    });
  });
});
