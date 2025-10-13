/**
 * Rate Plan Service
 * Business logic for rate plan operations
 */

const RatePlan = require('../models/RatePlan');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class RatePlanService {
  /**
   * Get all public (visible to customers) rate plans
   * @returns {Array} Public rate plans
   */
  async getPublicPlans() {
    try {
      const plans = await RatePlan.findAll({
        where: {
          isActive: true,
          isPublic: true,
        },
        order: [['displayOrder', 'ASC']],
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      });

      return plans;
    } catch (error) {
      logger.error('Get public plans error:', error);
      throw error;
    }
  }

  /**
   * Get all rate plans with pagination
   * @param {Object} options - Query options
   * @returns {Object} Paginated rate plans
   */
  async getAllPlans(options) {
    try {
      const {
        page = 1,
        limit = 20,
        isActive,
        planType,
        sortBy = 'displayOrder',
        sortOrder = 'ASC',
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (planType) {
        where.planType = planType;
      }

      const { count, rows } = await RatePlan.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      return {
        plans: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Get all plans error:', error);
      throw error;
    }
  }

  /**
   * Get rate plan by ID
   * @param {string} planId - Plan ID
   * @returns {Object} Rate plan
   */
  async getPlanById(planId) {
    try {
      const plan = await RatePlan.findByPk(planId);

      if (!plan) {
        throw new NotFoundError('Rate plan not found');
      }

      return plan;
    } catch (error) {
      logger.error('Get plan by ID error:', error);
      throw error;
    }
  }

  /**
   * Get rate plan by code
   * @param {string} code - Plan code
   * @returns {Object} Rate plan
   */
  async getPlanByCode(code) {
    try {
      const plan = await RatePlan.findOne({
        where: { planCode: code },
      });

      if (!plan) {
        throw new NotFoundError('Rate plan not found');
      }

      return plan;
    } catch (error) {
      logger.error('Get plan by code error:', error);
      throw error;
    }
  }

  /**
   * Create new rate plan
   * @param {Object} planData - Plan data
   * @returns {Object} Created plan
   */
  async createPlan(planData) {
    try {
      const plan = await RatePlan.create(planData);
      logger.info('Rate plan created', { planId: plan.id });
      return plan;
    } catch (error) {
      logger.error('Create plan error:', error);
      throw error;
    }
  }

  /**
   * Update rate plan
   * @param {string} planId - Plan ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated plan
   */
  async updatePlan(planId, updateData) {
    try {
      const plan = await this.getPlanById(planId);

      await plan.update(updateData);
      logger.info('Rate plan updated', { planId });

      return plan;
    } catch (error) {
      logger.error('Update plan error:', error);
      throw error;
    }
  }

  /**
   * Delete rate plan
   * @param {string} planId - Plan ID
   */
  async deletePlan(planId) {
    try {
      const plan = await this.getPlanById(planId);
      await plan.destroy();
      logger.info('Rate plan deleted', { planId });
    } catch (error) {
      logger.error('Delete plan error:', error);
      throw error;
    }
  }

  /**
   * Calculate subscription price based on plan, billing cycle, and add-ons
   * @param {Object} options - Calculation options
   * @returns {Object} Price breakdown
   */
  async calculateSubscriptionPrice(options) {
    try {
      const { planId, billingCycle = 'monthly', addons = {} } = options;

      const plan = await this.getPlanById(planId);

      if (!plan.isActive) {
        throw new ValidationError('Selected plan is not active');
      }

      let basePrice = 0;
      let discount = 0;
      let discountPercentage = 0;

      // Calculate base price based on billing cycle
      switch (billingCycle) {
        case 'monthly':
          basePrice = parseFloat(plan.monthlyPrice);
          break;
        case 'quarterly':
          basePrice = parseFloat(plan.monthlyPrice) * 3;
          // No OTC charges for add-ons if quarterly
          break;
        case 'annual':
          // Annual price has 20% discount
          basePrice = parseFloat(plan.annualPrice);
          const monthlyTotal = parseFloat(plan.monthlyPrice) * 12;
          discount = monthlyTotal - basePrice;
          discountPercentage = 20;
          break;
        default:
          basePrice = parseFloat(plan.monthlyPrice);
      }

      // Calculate add-ons cost
      let addonsCost = 0;
      const addonsDetails = [];
      
      // Parse metadata if it's a string
      let metadata = plan.metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          logger.error('Failed to parse metadata:', e);
          metadata = {};
        }
      }
      
      const addonsPricing = metadata.addons || {};

      // Extra Toll-Free Numbers
      if (addons.extraTollFreeNumbers && addons.extraTollFreeNumbers > 0) {
        // Monthly uses one-time charge, quarterly/annual uses pay-as-you-go
        const tfnCharge = billingCycle === 'monthly'
          ? addonsPricing.tfnCharge?.oneTime || 199.00
          : addonsPricing.tfnCharge?.payAsYouGo || 1.00;
        
        const tfnCost = tfnCharge * addons.extraTollFreeNumbers;
        addonsCost += tfnCost;
        
        addonsDetails.push({
          name: 'Extra Toll-Free Numbers',
          quantity: addons.extraTollFreeNumbers,
          unitPrice: tfnCharge,
          totalPrice: tfnCost,
          chargeType: billingCycle === 'monthly' ? 'one-time' : 'pay-as-you-go',
        });
      }

      // Extra Extensions
      if (addons.extraExtensions && addons.extraExtensions > 0) {
        // Monthly uses one-time charge, quarterly/annual uses pay-as-you-go
        const extCharge = billingCycle === 'monthly'
          ? addonsPricing.extensionCharge?.oneTime || 99.00
          : addonsPricing.extensionCharge?.payAsYouGo || 1.00;
        
        const extCost = extCharge * addons.extraExtensions;
        addonsCost += extCost;
        
        addonsDetails.push({
          name: 'Extra Extensions',
          quantity: addons.extraExtensions,
          unitPrice: extCharge,
          totalPrice: extCost,
          chargeType: billingCycle === 'monthly' ? 'one-time' : 'pay-as-you-go',
        });
      }

      // Calculate GST (18% in India)
      const subtotal = basePrice + addonsCost;
      const gstAmount = subtotal * 0.18;
      const totalAmount = subtotal + gstAmount;

      // Setup fee (if any)
      const setupFee = parseFloat(plan.setupFee) || 0;
      const grandTotal = totalAmount + setupFee;

      return {
        plan: {
          id: plan.id,
          name: plan.planName,
          type: plan.planType,
          code: plan.planCode,
        },
        billingCycle,
        pricing: {
          basePrice,
          addonsCost,
          subtotal,
          discount,
          discountPercentage,
          gstAmount,
          gstPercentage: 18,
          setupFee,
          totalAmount: grandTotal,
        },
        addons: addonsDetails,
        currency: plan.currency,
        features: plan.features,
        limits: plan.limits,
      };
    } catch (error) {
      logger.error('Calculate price error:', error);
      throw error;
    }
  }
}

module.exports = new RatePlanService();
