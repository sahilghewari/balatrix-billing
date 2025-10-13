/**
 * Rate Plan Controller
 * Handle rate plan-related HTTP requests
 */

const ratePlanService = require('../services/ratePlanService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
} = require('../utils/responseHandler');

/**
 * Get all public rate plans
 * GET /api/rate-plans/public
 */
exports.getPublicPlans = asyncHandler(async (req, res) => {
  const plans = await ratePlanService.getPublicPlans();
  return successResponse(res, plans, 'Public plans retrieved successfully');
});

/**
 * Get all rate plans (admin)
 * GET /api/rate-plans
 */
exports.getAllPlans = asyncHandler(async (req, res) => {
  const { page, limit, isActive, planType, sortBy, sortOrder } = req.query;

  const result = await ratePlanService.getAllPlans({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    isActive,
    planType,
    sortBy: sortBy || 'displayOrder',
    sortOrder: sortOrder || 'ASC',
  });

  return successResponse(res, result, 'Rate plans retrieved successfully');
});

/**
 * Get rate plan by ID
 * GET /api/rate-plans/:id
 */
exports.getPlanById = asyncHandler(async (req, res) => {
  const plan = await ratePlanService.getPlanById(req.params.id);
  return successResponse(res, plan, 'Rate plan retrieved successfully');
});

/**
 * Get rate plan by code
 * GET /api/rate-plans/code/:code
 */
exports.getPlanByCode = asyncHandler(async (req, res) => {
  const plan = await ratePlanService.getPlanByCode(req.params.code);
  return successResponse(res, plan, 'Rate plan retrieved successfully');
});

/**
 * Create new rate plan (admin)
 * POST /api/rate-plans
 */
exports.createPlan = asyncHandler(async (req, res) => {
  const plan = await ratePlanService.createPlan(req.body);
  return createdResponse(res, plan, 'Rate plan created successfully');
});

/**
 * Update rate plan (admin)
 * PUT /api/rate-plans/:id
 */
exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await ratePlanService.updatePlan(req.params.id, req.body);
  return successResponse(res, plan, 'Rate plan updated successfully');
});

/**
 * Delete rate plan (admin)
 * DELETE /api/rate-plans/:id
 */
exports.deletePlan = asyncHandler(async (req, res) => {
  await ratePlanService.deletePlan(req.params.id);
  return successResponse(res, null, 'Rate plan deleted successfully');
});

/**
 * Calculate subscription price
 * POST /api/rate-plans/calculate-price
 */
exports.calculatePrice = asyncHandler(async (req, res) => {
  const { planId, billingCycle, addons } = req.body;
  
  const pricing = await ratePlanService.calculateSubscriptionPrice({
    planId,
    billingCycle,
    addons,
  });
  
  return successResponse(res, pricing, 'Price calculated successfully');
});

module.exports = exports;
