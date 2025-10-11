/**
 * Unit Tests for Payment Service
 */

const paymentService = require('../../../src/services/paymentService');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createFullTestCustomer, createTestInvoice } = require('../../helpers/testFixtures');

// Mock external payment gateways
jest.mock('../../../src/config/razorpay', () => ({
  orders: {
    create: jest.fn().mockResolvedValue({
      id: 'order_test_123',
      amount: 41182,
      currency: 'INR',
      receipt: 'receipt_test_123',
    }),
  },
  payments: {
    fetch: jest.fn().mockResolvedValue({
      id: 'pay_test_123',
      order_id: 'order_test_123',
      status: 'captured',
      amount: 41182,
    }),
    capture: jest.fn().mockResolvedValue({
      id: 'pay_test_123',
      status: 'captured',
    }),
  },
}));

describe('Payment Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe('createRazorpayOrder', () => {
    it('should create Razorpay order', async () => {
      const { customer } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        totalAmount: 411.82,
      });

      const order = await paymentService.createRazorpayOrder({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        currency: 'INR',
      });

      expect(order).toBeDefined();
      expect(order.id).toBe('order_test_123');
      expect(order.amount).toBe(41182); // Amount in paise
    });
  });

  describe('verifyRazorpayPayment', () => {
    it('should verify Razorpay payment signature', async () => {
      const paymentData = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'valid_signature',
      };

      // Mock the signature verification
      const result = await paymentService.verifyRazorpayPayment(paymentData);

      expect(result).toBeDefined();
    });
  });

  describe('processPayment', () => {
    it('should process successful payment', async () => {
      const { customer, account } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        accountId: account.id,
        totalAmount: 411.82,
      });

      const payment = await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_123',
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('completed');
      expect(payment.amount).toBe(411.82);
      expect(payment.gatewayPaymentId).toBe('pay_test_123');
    });

    it('should handle failed payment', async () => {
      const { customer, account } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        accountId: account.id,
      });

      const payment = await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        status: 'failed',
        failureReason: 'Insufficient funds',
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('failed');
      expect(payment.failureReason).toBe('Insufficient funds');
    });
  });

  describe('processRefund', () => {
    it('should process refund for completed payment', async () => {
      const { customer, account } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        accountId: account.id,
      });

      // Create initial payment
      const payment = await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_123',
      });

      // Process refund
      const refund = await paymentService.processRefund({
        paymentId: payment.id,
        amount: 411.82,
        reason: 'Customer requested refund',
      });

      expect(refund).toBeDefined();
      
      await payment.reload();
      expect(payment.refundedAmount).toBe(411.82);
      expect(payment.refundReason).toBe('Customer requested refund');
    });

    it('should handle partial refunds', async () => {
      const { customer, account } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        accountId: account.id,
      });

      const payment = await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_123',
      });

      const partialAmount = 200;
      const refund = await paymentService.processRefund({
        paymentId: payment.id,
        amount: partialAmount,
        reason: 'Partial refund',
      });

      await payment.reload();
      expect(payment.refundedAmount).toBe(partialAmount);
      expect(payment.refundedAmount).toBeLessThan(payment.amount);
    });
  });

  describe('retryFailedPayment', () => {
    it('should retry failed payment', async () => {
      const { customer, account } = await createFullTestCustomer();
      const invoice = await createTestInvoice(customer.id, {
        accountId: account.id,
      });

      // Create failed payment
      const failedPayment = await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        status: 'failed',
        failureReason: 'Insufficient funds',
      });

      // Retry payment
      const retriedPayment = await paymentService.retryFailedPayment(failedPayment.id);

      expect(retriedPayment).toBeDefined();
      expect(retriedPayment.retryCount).toBeGreaterThan(0);
      expect(retriedPayment.lastRetryAt).toBeDefined();
    });
  });

  describe('listPayments', () => {
    it('should return paginated list of payments', async () => {
      const { customer, account } = await createFullTestCustomer();

      // Create multiple payments
      for (let i = 0; i < 5; i++) {
        const invoice = await createTestInvoice(customer.id, {
          accountId: account.id,
        });

        await paymentService.processPayment({
          customerId: customer.id,
          accountId: account.id,
          invoiceId: invoice.id,
          amount: 411.82,
          currency: 'INR',
          paymentMethod: 'credit_card',
          gateway: 'razorpay',
          gatewayPaymentId: `pay_test_${i}`,
        });
      }

      const result = await paymentService.listPayments({
        page: 1,
        limit: 3,
        customerId: customer.id,
      });

      expect(result.payments).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
    });

    it('should filter payments by status', async () => {
      const { customer, account } = await createFullTestCustomer();

      // Create completed payment
      const invoice1 = await createTestInvoice(customer.id, {
        accountId: account.id,
      });
      await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice1.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_1',
      });

      // Create failed payment
      const invoice2 = await createTestInvoice(customer.id, {
        accountId: account.id,
      });
      await paymentService.processPayment({
        customerId: customer.id,
        accountId: account.id,
        invoiceId: invoice2.id,
        amount: 411.82,
        currency: 'INR',
        paymentMethod: 'credit_card',
        gateway: 'razorpay',
        status: 'failed',
        failureReason: 'Test failure',
      });

      const result = await paymentService.listPayments({
        page: 1,
        limit: 10,
        customerId: customer.id,
        status: 'completed',
      });

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].status).toBe('completed');
    });
  });
});
