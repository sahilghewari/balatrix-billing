/**
 * Unit Tests for Subscription Service
 */

const subscriptionService = require('../../../src/services/subscriptionService');
const { Subscription } = require('../../../src/models');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createFullTestCustomer } = require('../../helpers/testFixtures');

describe('Subscription Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const { customer, account, ratePlan } = await createFullTestCustomer();

      const subscriptionData = {
        customerId: customer.id,
        accountId: account.id,
        ratePlanId: ratePlan.id,
        billingCycle: 'monthly',
        autoRenew: true,
      };

      const subscription = await subscriptionService.createSubscription(subscriptionData);

      expect(subscription).toBeDefined();
      expect(subscription.customerId).toBe(customer.id);
      expect(subscription.accountId).toBe(account.id);
      expect(subscription.ratePlanId).toBe(ratePlan.id);
      expect(subscription.status).toBe('active');
      expect(subscription.subscriptionNumber).toMatch(/^SUB-/);
    });

    it('should set trial period if specified', async () => {
      const { customer, account, ratePlan } = await createFullTestCustomer();

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const subscriptionData = {
        customerId: customer.id,
        accountId: account.id,
        ratePlanId: ratePlan.id,
        billingCycle: 'monthly',
        trialEndDate,
      };

      const subscription = await subscriptionService.createSubscription(subscriptionData);

      expect(subscription.trialEndDate).toBeDefined();
      expect(new Date(subscription.trialEndDate).getTime()).toBeCloseTo(
        trialEndDate.getTime(),
        -3
      );
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription with associated data', async () => {
      const { subscription } = await createFullTestCustomer();

      const result = await subscriptionService.getSubscriptionById(subscription.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(subscription.id);
      expect(result.Customer).toBeDefined();
      expect(result.Account).toBeDefined();
      expect(result.RatePlan).toBeDefined();
    });

    it('should return null for non-existent subscription', async () => {
      const result = await subscriptionService.getSubscriptionById(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const { subscription } = await createFullTestCustomer();

      const result = await subscriptionService.cancelSubscription(subscription.id, {
        immediate: true,
        reason: 'Customer request',
      });

      expect(result.status).toBe('cancelled');
      expect(result.cancelledAt).toBeDefined();
      expect(result.cancellationReason).toBe('Customer request');
    });

    it('should cancel subscription at period end', async () => {
      const { subscription } = await createFullTestCustomer();

      const result = await subscriptionService.cancelSubscription(subscription.id, {
        immediate: false,
        reason: 'Switching plans',
      });

      expect(result.status).toBe('active'); // Still active until period end
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.cancellationReason).toBe('Switching plans');
    });
  });

  describe('suspendSubscription', () => {
    it('should suspend active subscription', async () => {
      const { subscription } = await createFullTestCustomer();

      const result = await subscriptionService.suspendSubscription(subscription.id, {
        reason: 'Payment failure',
      });

      expect(result.status).toBe('suspended');
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate suspended subscription', async () => {
      const { subscription } = await createFullTestCustomer({
        subscription: { status: 'suspended' },
      });

      const result = await subscriptionService.reactivateSubscription(subscription.id);

      expect(result.status).toBe('active');
    });
  });

  describe('changeSubscriptionPlan', () => {
    it('should change subscription to different plan', async () => {
      const { subscription, ratePlan } = await createFullTestCustomer();

      // Create a different rate plan
      const { ratePlan: newRatePlan } = await createFullTestCustomer();

      const result = await subscriptionService.changeSubscriptionPlan(
        subscription.id,
        newRatePlan.id,
        {
          immediate: true,
        }
      );

      expect(result.ratePlanId).toBe(newRatePlan.id);
    });
  });

  describe('renewSubscription', () => {
    it('should renew expired subscription', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);

      const { subscription } = await createFullTestCustomer({
        subscription: {
          status: 'expired',
          endDate: pastDate,
        },
      });

      const result = await subscriptionService.renewSubscription(subscription.id);

      expect(result.status).toBe('active');
      expect(new Date(result.nextBillingDate).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('listSubscriptions', () => {
    it('should return paginated list of subscriptions', async () => {
      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        await createFullTestCustomer();
      }

      const result = await subscriptionService.listSubscriptions({
        page: 1,
        limit: 3,
      });

      expect(result.subscriptions).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
    });

    it('should filter subscriptions by status', async () => {
      await createFullTestCustomer({ subscription: { status: 'active' } });
      await createFullTestCustomer({ subscription: { status: 'suspended' } });

      const result = await subscriptionService.listSubscriptions({
        page: 1,
        limit: 10,
        status: 'active',
      });

      expect(result.subscriptions).toHaveLength(1);
      expect(result.subscriptions[0].status).toBe('active');
    });
  });

  describe('getCustomerSubscriptions', () => {
    it('should return all subscriptions for a customer', async () => {
      const { customer } = await createFullTestCustomer();

      // Create another subscription for same customer
      const { ratePlan, account } = await createFullTestCustomer();
      await Subscription.create({
        customerId: customer.id,
        accountId: account.id,
        ratePlanId: ratePlan.id,
        subscriptionNumber: `SUB-${Date.now()}`,
        status: 'active',
        billingCycle: 'annual',
        startDate: new Date(),
        nextBillingDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      });

      const subscriptions = await subscriptionService.getCustomerSubscriptions(customer.id);

      expect(subscriptions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
