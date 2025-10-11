/**
 * Unit Tests for Billing Service
 */

const billingService = require('../../../src/services/billingService');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createFullTestCustomer, createTestCDR } = require('../../helpers/testFixtures');
const { Invoice } = require('../../../src/models');

describe('Billing Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('generateSubscriptionInvoice', () => {
    it('should generate invoice for monthly subscription', async () => {
      const { subscription, customer, account } = await createFullTestCustomer();

      const invoice = await billingService.generateSubscriptionInvoice(subscription.id);

      expect(invoice).toBeDefined();
      expect(invoice.customerId).toBe(customer.id);
      expect(invoice.accountId).toBe(account.id);
      expect(invoice.subscriptionId).toBe(subscription.id);
      expect(invoice.invoiceType).toBe('subscription');
      expect(invoice.status).toBe('finalized');
      expect(invoice.subtotal).toBeGreaterThan(0);
      expect(invoice.totalAmount).toBeGreaterThan(invoice.subtotal); // Should include tax
    });

    it('should include GST in invoice for Indian customer', async () => {
      const { subscription } = await createFullTestCustomer({
        customer: {
          billingState: 'Karnataka',
          billingCountry: 'India',
        },
      });

      const invoice = await billingService.generateSubscriptionInvoice(subscription.id);

      expect(invoice.taxAmount).toBeGreaterThan(0);
      expect(invoice.taxBreakdown).toBeDefined();
      // For intra-state, should have CGST and SGST
      if (invoice.taxBreakdown.cgst) {
        expect(invoice.taxBreakdown.cgst).toBeGreaterThan(0);
        expect(invoice.taxBreakdown.sgst).toBeGreaterThan(0);
      } else {
        // For inter-state, should have IGST
        expect(invoice.taxBreakdown.igst).toBeGreaterThan(0);
      }
    });

    it('should create line items for subscription', async () => {
      const { subscription } = await createFullTestCustomer();

      const invoice = await billingService.generateSubscriptionInvoice(subscription.id);

      expect(invoice.lineItems).toBeDefined();
      expect(invoice.lineItems.length).toBeGreaterThan(0);
      
      const subscriptionItem = invoice.lineItems.find(
        item => item.description.includes('Subscription')
      );
      expect(subscriptionItem).toBeDefined();
    });
  });

  describe('generateUsageInvoice', () => {
    it('should generate invoice with overage charges', async () => {
      const { subscription, account, customer, ratePlan } = await createFullTestCustomer({
        ratePlan: {
          includedMinutes: 100,
          overageRatePerMinute: 1,
        },
      });

      // Create CDRs exceeding included minutes
      for (let i = 0; i < 15; i++) {
        await createTestCDR(subscription.id, account.id, {
          duration: 600, // 10 minutes each = 150 minutes total
          billableSeconds: 600,
          cost: 10,
        });
      }

      const invoice = await billingService.generateUsageInvoice(subscription.id);

      expect(invoice).toBeDefined();
      expect(invoice.invoiceType).toBe('usage');
      
      // Should have overage charges for 50 minutes
      const overageItem = invoice.lineItems.find(
        item => item.description.includes('Overage')
      );
      expect(overageItem).toBeDefined();
    });
  });

  describe('processPayment', () => {
    it('should process payment and update invoice', async () => {
      const { subscription, customer, account } = await createFullTestCustomer();

      const invoice = await billingService.generateSubscriptionInvoice(subscription.id);

      const payment = await billingService.processPayment({
        invoiceId: invoice.id,
        customerId: customer.id,
        accountId: account.id,
        amount: invoice.totalAmount,
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_123',
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('completed');
      expect(payment.amount).toBe(invoice.totalAmount);

      // Check invoice is marked as paid
      await invoice.reload();
      expect(invoice.status).toBe('paid');
      expect(invoice.paidAmount).toBe(invoice.totalAmount);
      expect(invoice.balanceAmount).toBe(0);
    });

    it('should handle partial payments', async () => {
      const { subscription, customer, account } = await createFullTestCustomer();

      const invoice = await billingService.generateSubscriptionInvoice(subscription.id);
      const partialAmount = invoice.totalAmount / 2;

      const payment = await billingService.processPayment({
        invoiceId: invoice.id,
        customerId: customer.id,
        accountId: account.id,
        amount: partialAmount,
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_123',
      });

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(partialAmount);

      await invoice.reload();
      expect(invoice.status).toBe('partially_paid');
      expect(invoice.paidAmount).toBe(partialAmount);
      expect(invoice.balanceAmount).toBeCloseTo(partialAmount, 2);
    });
  });

  describe('getOverdueInvoices', () => {
    it('should return list of overdue invoices', async () => {
      const { subscription, customer, account } = await createFullTestCustomer();

      // Create overdue invoice
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 10);

      await Invoice.create({
        customerId: customer.id,
        accountId: account.id,
        subscriptionId: subscription.id,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceType: 'subscription',
        status: 'finalized',
        subtotal: 349,
        taxAmount: 62.82,
        totalAmount: 411.82,
        paidAmount: 0,
        balanceAmount: 411.82,
        currency: 'INR',
        issueDate: pastDue,
        dueDate: pastDue,
      });

      const overdueInvoices = await billingService.getOverdueInvoices();

      expect(overdueInvoices.length).toBeGreaterThan(0);
      expect(overdueInvoices[0].customerId).toBe(customer.id);
    });
  });

  describe('calculateProration', () => {
    it('should calculate prorated amount for partial period', () => {
      const fullAmount = 300; // ₹10 per day
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-31');

      const prorated = billingService.calculateProration({
        fullAmount,
        startDate,
        endDate,
        billingCycle: 'monthly',
      });

      expect(prorated).toBeGreaterThan(0);
      expect(prorated).toBeLessThan(fullAmount);
    });

    it('should return full amount for complete period', () => {
      const fullAmount = 300;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const prorated = billingService.calculateProration({
        fullAmount,
        startDate,
        endDate,
        billingCycle: 'monthly',
      });

      expect(prorated).toBe(fullAmount);
    });
  });
});
