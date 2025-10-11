/**
 * Pricing Service
 * Calculate pricing for subscriptions, usage, and overages
 */

const {
  SUBSCRIPTION_PLANS,
  ADDON_PRICING,
  TAX_RATES,
  BILLING_CYCLE,
} = require('../utils/constants');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class PricingService {
  /**
   * Get subscription price
   */
  getSubscriptionPrice(planType, billingCycle = 'monthly') {
    const plan = SUBSCRIPTION_PLANS[planType.toUpperCase()];

    if (!plan) {
      throw new NotFoundError(`Plan type '${planType}' not found`);
    }

    if (billingCycle === BILLING_CYCLE.MONTHLY) {
      return {
        baseAmount: plan.pricing.monthly,
        discount: 0,
        finalAmount: plan.pricing.monthly,
        currency: 'INR',
        billingCycle: 'monthly',
      };
    }

    if (billingCycle === BILLING_CYCLE.ANNUAL) {
      const monthlyTotal = plan.pricing.monthly * 12;
      const annualPrice = plan.pricing.annual;
      const discount = monthlyTotal - annualPrice;
      const discountPercent = ((discount / monthlyTotal) * 100).toFixed(2);

      return {
        baseAmount: monthlyTotal,
        discount,
        discountPercent,
        finalAmount: annualPrice,
        currency: 'INR',
        billingCycle: 'annual',
        savings: discount,
      };
    }

    throw new ValidationError(`Invalid billing cycle: ${billingCycle}`);
  }

  /**
   * Calculate overage charges for minutes
   */
  calculateMinutesOverage(usedMinutes, includedMinutes, overageRate) {
    if (usedMinutes <= includedMinutes) {
      return {
        overageMinutes: 0,
        overageAmount: 0,
      };
    }

    const overageMinutes = usedMinutes - includedMinutes;
    const overageAmount = overageMinutes * overageRate;

    return {
      overageMinutes,
      overageAmount: parseFloat(overageAmount.toFixed(2)),
    };
  }

  /**
   * Calculate addon pricing
   */
  calculateAddonPrice(addonType, quantity = 1) {
    const addon = ADDON_PRICING[addonType.toUpperCase()];

    if (!addon) {
      throw new NotFoundError(`Addon type '${addonType}' not found`);
    }

    return {
      addonType,
      quantity,
      unitPrice: addon.price,
      totalAmount: addon.price * quantity,
      recurring: addon.recurring,
      currency: 'INR',
    };
  }

  /**
   * Calculate toll-free number addon
   */
  calculateTollFreeAddon(quantity = 1) {
    return this.calculateAddonPrice('TOLL_FREE_NUMBER', quantity);
  }

  /**
   * Calculate extension addon
   */
  calculateExtensionAddon(quantity = 1) {
    return this.calculateAddonPrice('EXTENSION', quantity);
  }

  /**
   * Calculate full subscription cost including overages and addons
   */
  calculateSubscriptionCost(options) {
    const {
      planType,
      billingCycle = 'monthly',
      usedMinutes = 0,
      tollFreeNumbers = 0,
      extensions = 0,
    } = options;

    const plan = SUBSCRIPTION_PLANS[planType.toUpperCase()];

    if (!plan) {
      throw new NotFoundError(`Plan type '${planType}' not found`);
    }

    // Base subscription price
    const subscriptionPrice = this.getSubscriptionPrice(planType, billingCycle);

    // Calculate minutes overage
    const minutesOverage = this.calculateMinutesOverage(
      usedMinutes,
      plan.limits.minutes,
      plan.overage.perMinute
    );

    // Calculate toll-free addon
    const tollFreeAddon =
      tollFreeNumbers > 0 ? this.calculateTollFreeAddon(tollFreeNumbers) : null;

    // Calculate extension addon
    const extensionAddon =
      extensions > 0 ? this.calculateExtensionAddon(extensions) : null;

    // Calculate subtotal
    let subtotal = subscriptionPrice.finalAmount + minutesOverage.overageAmount;

    if (tollFreeAddon) {
      subtotal += tollFreeAddon.totalAmount;
    }

    if (extensionAddon) {
      subtotal += extensionAddon.totalAmount;
    }

    // Calculate tax (GST)
    const taxAmount = subtotal * TAX_RATES.GST;

    // Calculate total
    const total = subtotal + taxAmount;

    return {
      subscription: subscriptionPrice,
      usage: {
        minutes: {
          included: plan.limits.minutes,
          used: usedMinutes,
          overage: minutesOverage,
        },
      },
      addons: {
        tollFreeNumbers: tollFreeAddon,
        extensions: extensionAddon,
      },
      breakdown: {
        subscriptionAmount: subscriptionPrice.finalAmount,
        minutesOverageAmount: minutesOverage.overageAmount,
        addonsAmount:
          (tollFreeAddon?.totalAmount || 0) + (extensionAddon?.totalAmount || 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      },
      currency: 'INR',
    };
  }

  /**
   * Calculate prorated amount for subscription changes
   */
  calculateProratedAmount(options) {
    const {
      currentPlanAmount,
      newPlanAmount,
      daysRemaining,
      totalDaysInCycle,
    } = options;

    // Calculate unused amount from current plan
    const unusedAmount =
      (currentPlanAmount / totalDaysInCycle) * daysRemaining;

    // Calculate amount for new plan
    const newPlanProratedAmount =
      (newPlanAmount / totalDaysInCycle) * daysRemaining;

    // Calculate difference (credit or charge)
    const difference = newPlanProratedAmount - unusedAmount;

    return {
      currentPlanUnusedAmount: parseFloat(unusedAmount.toFixed(2)),
      newPlanProratedAmount: parseFloat(newPlanProratedAmount.toFixed(2)),
      difference: parseFloat(difference.toFixed(2)),
      isCredit: difference < 0,
      isCharge: difference > 0,
      daysRemaining,
      totalDaysInCycle,
    };
  }

  /**
   * Calculate GST breakdown (CGST/SGST or IGST)
   */
  calculateGST(amount, isInterState = false) {
    const gstAmount = amount * TAX_RATES.GST;

    if (isInterState) {
      // Interstate transaction - use IGST
      return {
        cgst: 0,
        sgst: 0,
        igst: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(gstAmount.toFixed(2)),
      };
    } else {
      // Intrastate transaction - use CGST + SGST
      const cgst = amount * TAX_RATES.CGST;
      const sgst = amount * TAX_RATES.SGST;

      return {
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: 0,
        total: parseFloat((cgst + sgst).toFixed(2)),
      };
    }
  }

  /**
   * Get plan features and limits
   */
  getPlanDetails(planType) {
    const plan = SUBSCRIPTION_PLANS[planType.toUpperCase()];

    if (!plan) {
      throw new NotFoundError(`Plan type '${planType}' not found`);
    }

    return {
      name: plan.name,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      overage: plan.overage,
    };
  }

  /**
   * Compare plans
   */
  comparePlans(planType1, planType2) {
    const plan1 = this.getPlanDetails(planType1);
    const plan2 = this.getPlanDetails(planType2);

    return {
      plan1: {
        name: plan1.name,
        monthlyPrice: plan1.pricing.monthly,
        annualPrice: plan1.pricing.annual,
        minutes: plan1.limits.minutes,
        did: plan1.limits.did,
        extensions: plan1.limits.extensions,
      },
      plan2: {
        name: plan2.name,
        monthlyPrice: plan2.pricing.monthly,
        annualPrice: plan2.pricing.annual,
        minutes: plan2.limits.minutes,
        did: plan2.limits.did,
        extensions: plan2.limits.extensions,
      },
      differences: {
        monthlyPriceDiff: plan2.pricing.monthly - plan1.pricing.monthly,
        annualPriceDiff: plan2.pricing.annual - plan1.pricing.annual,
        minutesDiff: plan2.limits.minutes - plan1.limits.minutes,
        didDiff: plan2.limits.did - plan1.limits.did,
        extensionsDiff: plan2.limits.extensions - plan1.limits.extensions,
      },
    };
  }

  /**
   * Calculate renewal price with potential discounts
   */
  calculateRenewalPrice(options) {
    const {
      planType,
      billingCycle = 'monthly',
      loyaltyDiscount = 0, // Percentage discount for loyal customers
      promoCode = null,
    } = options;

    const basePrice = this.getSubscriptionPrice(planType, billingCycle);
    let finalAmount = basePrice.finalAmount;
    const discounts = [];

    // Apply loyalty discount
    if (loyaltyDiscount > 0) {
      const loyaltyAmount = finalAmount * (loyaltyDiscount / 100);
      finalAmount -= loyaltyAmount;
      discounts.push({
        type: 'loyalty',
        percent: loyaltyDiscount,
        amount: parseFloat(loyaltyAmount.toFixed(2)),
      });
    }

    // TODO: Apply promo code discount
    // This would require a promo code validation system

    const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0);

    return {
      baseAmount: basePrice.finalAmount,
      discounts,
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      currency: 'INR',
      billingCycle,
    };
  }

  /**
   * Estimate monthly cost based on usage patterns
   */
  estimateMonthlyCost(options) {
    const {
      planType,
      estimatedMinutes,
      tollFreeNumbers = 0,
      extensions = 0,
    } = options;

    const plan = SUBSCRIPTION_PLANS[planType.toUpperCase()];

    if (!plan) {
      throw new NotFoundError(`Plan type '${planType}' not found`);
    }

    // Calculate for monthly billing
    const cost = this.calculateSubscriptionCost({
      planType,
      billingCycle: 'monthly',
      usedMinutes: estimatedMinutes,
      tollFreeNumbers,
      extensions,
    });

    return {
      ...cost,
      isEstimate: true,
      estimatedAt: new Date().toISOString(),
      recommendation:
        estimatedMinutes > plan.limits.minutes
          ? `Consider upgrading to a higher plan to reduce overage charges.`
          : `Your current plan fits your usage well.`,
    };
  }

  /**
   * Get all available plans
   */
  getAllPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      type: plan.name.toUpperCase().replace(/ /g, '_'),
      name: plan.name,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
    }));
  }

  /**
   * Get addon pricing list
   */
  getAddonPricing() {
    return Object.entries(ADDON_PRICING).map(([key, addon]) => ({
      type: key,
      name: addon.name,
      price: addon.price,
      recurring: addon.recurring,
      currency: 'INR',
    }));
  }
}

module.exports = new PricingService();
