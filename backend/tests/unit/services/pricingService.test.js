/**
 * Unit Tests for Pricing Service
 */

const pricingService = require('../../../src/services/pricingService');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestRatePlan } = require('../../helpers/testFixtures');

describe('Pricing Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('calculateCallCost', () => {
    let ratePlan;

    beforeEach(async () => {
      ratePlan = await createTestRatePlan({
        overageRatePerMinute: 0.5,
        includedMinutes: 500,
      });
    });

    it('should calculate cost for call within included minutes', () => {
      const cost = pricingService.calculateCallCost({
        durationSeconds: 120, // 2 minutes
        callType: 'local',
        ratePlan,
        minutesUsed: 100,
      });

      expect(cost).toBe(0); // Within included minutes
    });

    it('should calculate overage cost for call exceeding included minutes', () => {
      const cost = pricingService.calculateCallCost({
        durationSeconds: 300, // 5 minutes
        callType: 'local',
        ratePlan,
        minutesUsed: 498, // 498 + 5 = 503, 3 minutes overage
      });

      // 2 minutes free (to reach 500) + 3 minutes overage at ₹0.5
      expect(cost).toBe(1.5);
    });

    it('should calculate cost for all overage minutes', () => {
      const cost = pricingService.calculateCallCost({
        durationSeconds: 600, // 10 minutes
        callType: 'local',
        ratePlan,
        minutesUsed: 550, // All minutes are overage
      });

      expect(cost).toBe(5.0); // 10 * 0.5
    });

    it('should handle zero duration calls', () => {
      const cost = pricingService.calculateCallCost({
        durationSeconds: 0,
        callType: 'local',
        ratePlan,
        minutesUsed: 100,
      });

      expect(cost).toBe(0);
    });
  });

  describe('calculateSubscriptionCost', () => {
    it('should calculate monthly subscription cost', async () => {
      const ratePlan = await createTestRatePlan({
        monthlyPrice: 349,
        setupFee: 0,
      });

      const cost = pricingService.calculateSubscriptionCost({
        ratePlan,
        billingCycle: 'monthly',
        isNewSubscription: false,
      });

      expect(cost.subtotal).toBe(349);
      expect(cost.setupFee).toBe(0);
      expect(cost.total).toBe(349);
    });

    it('should calculate annual subscription cost', async () => {
      const ratePlan = await createTestRatePlan({
        annualPrice: 4008,
        setupFee: 0,
      });

      const cost = pricingService.calculateSubscriptionCost({
        ratePlan,
        billingCycle: 'annual',
        isNewSubscription: false,
      });

      expect(cost.subtotal).toBe(4008);
      expect(cost.setupFee).toBe(0);
      expect(cost.total).toBe(4008);
    });

    it('should include setup fee for new subscription', async () => {
      const ratePlan = await createTestRatePlan({
        monthlyPrice: 349,
        setupFee: 500,
      });

      const cost = pricingService.calculateSubscriptionCost({
        ratePlan,
        billingCycle: 'monthly',
        isNewSubscription: true,
      });

      expect(cost.subtotal).toBe(349);
      expect(cost.setupFee).toBe(500);
      expect(cost.total).toBe(849);
    });

    it('should calculate prorated cost for mid-month start', async () => {
      const ratePlan = await createTestRatePlan({
        monthlyPrice: 300, // ₹10 per day
        setupFee: 0,
      });

      const cost = pricingService.calculateSubscriptionCost({
        ratePlan,
        billingCycle: 'monthly',
        isNewSubscription: false,
        prorateFromDate: new Date('2024-01-15'),
        prorateToDate: new Date('2024-01-31'),
      });

      expect(cost.subtotal).toBeGreaterThan(0);
      expect(cost.subtotal).toBeLessThan(300); // Should be prorated
    });
  });

  describe('calculateInvoiceWithTax', () => {
    it('should calculate invoice with GST for Indian customer', () => {
      const invoice = pricingService.calculateInvoiceWithTax({
        subtotal: 349,
        customerState: 'Karnataka',
        companyState: 'Karnataka',
        country: 'India',
      });

      // CGST 9% + SGST 9% = 18%
      expect(invoice.taxAmount).toBeCloseTo(62.82, 2);
      expect(invoice.totalAmount).toBeCloseTo(411.82, 2);
      expect(invoice.taxBreakdown).toHaveProperty('cgst');
      expect(invoice.taxBreakdown).toHaveProperty('sgst');
      expect(invoice.taxBreakdown.cgst).toBeCloseTo(31.41, 2);
      expect(invoice.taxBreakdown.sgst).toBeCloseTo(31.41, 2);
    });

    it('should calculate invoice with IGST for inter-state transaction', () => {
      const invoice = pricingService.calculateInvoiceWithTax({
        subtotal: 349,
        customerState: 'Maharashtra',
        companyState: 'Karnataka',
        country: 'India',
      });

      // IGST 18%
      expect(invoice.taxAmount).toBeCloseTo(62.82, 2);
      expect(invoice.totalAmount).toBeCloseTo(411.82, 2);
      expect(invoice.taxBreakdown).toHaveProperty('igst');
      expect(invoice.taxBreakdown.igst).toBeCloseTo(62.82, 2);
    });

    it('should not add tax for international customer', () => {
      const invoice = pricingService.calculateInvoiceWithTax({
        subtotal: 349,
        customerState: 'California',
        companyState: 'Karnataka',
        country: 'USA',
      });

      expect(invoice.taxAmount).toBe(0);
      expect(invoice.totalAmount).toBe(349);
      expect(invoice.taxBreakdown).toEqual({});
    });

    it('should handle zero subtotal', () => {
      const invoice = pricingService.calculateInvoiceWithTax({
        subtotal: 0,
        customerState: 'Karnataka',
        companyState: 'Karnataka',
        country: 'India',
      });

      expect(invoice.taxAmount).toBe(0);
      expect(invoice.totalAmount).toBe(0);
    });
  });

  describe('calculateOverageCost', () => {
    it('should calculate overage cost correctly', async () => {
      const ratePlan = await createTestRatePlan({
        includedMinutes: 500,
        overageRatePerMinute: 0.5,
      });

      const cost = pricingService.calculateOverageCost({
        minutesUsed: 650,
        ratePlan,
      });

      // 150 overage minutes * ₹0.5
      expect(cost.overageMinutes).toBe(150);
      expect(cost.overageCost).toBe(75);
    });

    it('should return zero cost when within included minutes', async () => {
      const ratePlan = await createTestRatePlan({
        includedMinutes: 500,
        overageRatePerMinute: 0.5,
      });

      const cost = pricingService.calculateOverageCost({
        minutesUsed: 300,
        ratePlan,
      });

      expect(cost.overageMinutes).toBe(0);
      expect(cost.overageCost).toBe(0);
    });
  });

  describe('getCallTypeRate', () => {
    it('should return base rate for local calls', () => {
      const rate = pricingService.getCallTypeRate('local', 0.5);
      expect(rate).toBe(0.5);
    });

    it('should return higher rate for STD calls', () => {
      const rate = pricingService.getCallTypeRate('std', 0.5);
      expect(rate).toBeGreaterThan(0.5);
    });

    it('should return highest rate for ISD calls', () => {
      const localRate = pricingService.getCallTypeRate('local', 0.5);
      const stdRate = pricingService.getCallTypeRate('std', 0.5);
      const isdRate = pricingService.getCallTypeRate('isd', 0.5);

      expect(isdRate).toBeGreaterThan(stdRate);
      expect(stdRate).toBeGreaterThan(localRate);
    });
  });
});
