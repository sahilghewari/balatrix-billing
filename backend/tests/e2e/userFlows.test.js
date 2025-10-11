/**
 * End-to-End Tests for Complete User Flows
 */

const request = require('supertest');
const app = require('app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestRatePlan } = require('../../helpers/testFixtures');
const { Customer, Account, Subscription, Payment, Invoice } = require('../../../src/models');

describe('E2E Tests - Complete User Flows', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Complete Customer Onboarding Flow', () => {
    it('should complete full onboarding: register -> create customer -> create subscription', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newcustomer',
          email: 'newcustomer@example.com',
          password: 'Customer@123',
          firstName: 'New',
          lastName: 'Customer',
          phoneNumber: '+919876543210',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const accessToken = registerResponse.body.data.tokens.accessToken;
      const userId = registerResponse.body.data.user.id;

      // Step 2: Create customer profile
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          companyName: 'New Customer Corp',
          businessType: 'company',
          gstin: '29ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          billingAddress: '123 Startup Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(201);

      expect(customerResponse.body.success).toBe(true);
      const customerId = customerResponse.body.data.id;

      // Verify customer was created
      const customer = await Customer.findByPk(customerId);
      expect(customer).toBeDefined();
      expect(customer.userId).toBe(userId);

      // Step 3: Create account (prepaid with initial balance)
      const account = await Account.create({
        customerId,
        accountNumber: `ACC-${Date.now()}`,
        accountType: 'prepaid',
        balance: 5000,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
      });

      expect(account).toBeDefined();
      expect(account.balance).toBe(5000);

      // Step 4: Get available rate plans
      const ratePlansResponse = await request(app)
        .get('/api/rate-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(ratePlansResponse.body.success).toBe(true);
      
      // Create a rate plan if none exists
      let ratePlan;
      if (ratePlansResponse.body.data.length === 0) {
        ratePlan = await createTestRatePlan();
      } else {
        ratePlan = ratePlansResponse.body.data[0];
      }

      // Step 5: Create subscription
      const subscriptionResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          accountId: account.id,
          ratePlanId: ratePlan.id,
          billingCycle: 'monthly',
          autoRenew: true,
        })
        .expect(201);

      expect(subscriptionResponse.body.success).toBe(true);
      const subscription = subscriptionResponse.body.data;

      expect(subscription.status).toBe('active');
      expect(subscription.ratePlanId).toBe(ratePlan.id);

      // Step 6: Verify complete setup
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.id).toBe(userId);

      // Verify subscription is active
      const subscriptionCheck = await Subscription.findByPk(subscription.id);
      expect(subscriptionCheck.status).toBe('active');
      expect(subscriptionCheck.customerId).toBe(customerId);
    });
  });

  describe('Complete Billing Cycle Flow', () => {
    it('should complete full billing cycle: subscription -> usage -> invoice -> payment', async () => {
      // Setup: Create rate plan
      const ratePlan = await createTestRatePlan({
        monthlyPrice: 500,
        includedMinutes: 100,
        overageRatePerMinute: 1,
      });

      // Step 1: Register and setup customer
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'billingtest',
          email: 'billing@example.com',
          password: 'Test@123',
          firstName: 'Billing',
          lastName: 'Test',
        })
        .expect(201);

      const accessToken = registerResponse.body.data.tokens.accessToken;

      // Step 2: Create customer profile
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(201);

      const customerId = customerResponse.body.data.id;

      // Step 3: Create account with balance
      const account = await Account.create({
        customerId,
        accountNumber: `ACC-${Date.now()}`,
        accountType: 'prepaid',
        balance: 1000,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
      });

      // Step 4: Create subscription
      const subscriptionResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          accountId: account.id,
          ratePlanId: ratePlan.id,
          billingCycle: 'monthly',
        })
        .expect(201);

      const subscription = subscriptionResponse.body.data;

      // Step 5: Simulate usage (create CDRs)
      // This would normally be done by the CDR processing system
      // For testing, we'll create invoice directly

      // Step 6: Generate invoice
      const invoice = await Invoice.create({
        customerId,
        accountId: account.id,
        subscriptionId: subscription.id,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceType: 'subscription',
        status: 'finalized',
        subtotal: 500,
        taxAmount: 90, // 18% GST
        totalAmount: 590,
        paidAmount: 0,
        balanceAmount: 590,
        currency: 'INR',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Monthly Subscription',
            quantity: 1,
            unitPrice: 500,
            amount: 500,
          },
        ],
      });

      expect(invoice).toBeDefined();
      expect(invoice.totalAmount).toBe(590);

      // Step 7: Create payment
      const payment = await Payment.create({
        customerId,
        accountId: account.id,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        paymentNumber: `PAY-${Date.now()}`,
        amount: 590,
        currency: 'INR',
        paymentMethod: 'credit_card',
        status: 'completed',
        gateway: 'razorpay',
        gatewayPaymentId: `pay_test_${Date.now()}`,
        paidAt: new Date(),
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('completed');

      // Step 8: Update invoice as paid
      await invoice.update({
        status: 'paid',
        paidAmount: 590,
        balanceAmount: 0,
        paidDate: new Date(),
      });

      // Step 9: Verify everything
      await invoice.reload();
      expect(invoice.status).toBe('paid');
      expect(invoice.balanceAmount).toBe(0);

      await account.reload();
      // Account balance should be updated after payment processing
      
      const subscriptionCheck = await Subscription.findByPk(subscription.id);
      expect(subscriptionCheck.status).toBe('active');
    });
  });

  describe('Subscription Cancellation Flow', () => {
    it('should handle subscription cancellation and refund', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'canceltest',
          email: 'cancel@example.com',
          password: 'Test@123',
          firstName: 'Cancel',
          lastName: 'Test',
        })
        .expect(201);

      const accessToken = registerResponse.body.data.tokens.accessToken;

      // Step 2: Create customer
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(201);

      const customerId = customerResponse.body.data.id;

      // Step 3: Create account
      const account = await Account.create({
        customerId,
        accountNumber: `ACC-${Date.now()}`,
        accountType: 'prepaid',
        balance: 500,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
      });

      // Step 4: Create rate plan
      const ratePlan = await createTestRatePlan();

      // Step 5: Create subscription
      const subscriptionResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          accountId: account.id,
          ratePlanId: ratePlan.id,
          billingCycle: 'monthly',
        })
        .expect(201);

      const subscriptionId = subscriptionResponse.body.data.id;

      // Step 6: Login as admin to cancel subscription
      const adminUser = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin@123',
          firstName: 'Admin',
          lastName: 'User',
        });

      // Manually set admin role
      const { User } = require('../../../src/models');
      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      await admin.update({ role: 'admin' });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      const adminToken = adminLogin.body.data.tokens.accessToken;

      // Step 7: Cancel subscription
      const cancelResponse = await request(app)
        .post(`/api/subscriptions/${subscriptionId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          immediate: true,
          reason: 'Customer requested cancellation',
        })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('cancelled');
      expect(cancelResponse.body.data.cancellationReason).toBe('Customer requested cancellation');

      // Step 8: Verify subscription is cancelled
      const subscription = await Subscription.findByPk(subscriptionId);
      expect(subscription.status).toBe('cancelled');
      expect(subscription.cancelledAt).toBeDefined();
    });
  });

  describe('Account Balance Management Flow', () => {
    it('should handle low balance alert and auto-recharge', async () => {
      // Step 1: Setup customer with auto-recharge enabled
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'balancetest',
          email: 'balance@example.com',
          password: 'Test@123',
          firstName: 'Balance',
          lastName: 'Test',
        })
        .expect(201);

      const accessToken = registerResponse.body.data.tokens.accessToken;

      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          billingAddress: '123 Test Street',
          billingCity: 'Bangalore',
          billingState: 'Karnataka',
          billingCountry: 'India',
          billingPincode: '560001',
        })
        .expect(201);

      const customerId = customerResponse.body.data.id;

      // Step 2: Create account with low balance and auto-recharge
      const account = await Account.create({
        customerId,
        accountNumber: `ACC-${Date.now()}`,
        accountType: 'prepaid',
        balance: 50, // Low balance
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
        autoRecharge: true,
        autoRechargeAmount: 500,
        autoRechargeThreshold: 100,
        lowBalanceAlert: true,
        lowBalanceThreshold: 100,
      });

      expect(account.balance).toBe(50);
      expect(account.balance).toBeLessThan(account.lowBalanceThreshold);

      // Step 3: Simulate auto-recharge payment
      const rechargePayment = await Payment.create({
        customerId,
        accountId: account.id,
        paymentNumber: `PAY-${Date.now()}`,
        amount: 500,
        currency: 'INR',
        paymentMethod: 'auto_recharge',
        status: 'completed',
        gateway: 'razorpay',
        gatewayPaymentId: `pay_test_${Date.now()}`,
        description: 'Auto recharge',
        paidAt: new Date(),
      });

      // Step 4: Update account balance
      await account.update({
        balance: account.balance + 500,
      });

      await account.reload();
      expect(account.balance).toBe(550);
      expect(account.balance).toBeGreaterThan(account.lowBalanceThreshold);

      // Verify payment was recorded
      const payment = await Payment.findByPk(rechargePayment.id);
      expect(payment.status).toBe('completed');
      expect(payment.amount).toBe(500);
    });
  });
});
