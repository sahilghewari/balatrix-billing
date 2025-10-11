/**
 * Subscription Controller
 * Handle subscription-related HTTP requests
 */

const subscriptionService = require('../services/subscriptionService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
} = require('../utils/responseHandler');

/**
 * Create new subscription
 * POST /api/subscriptions
 */
exports.createSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.createSubscription(req.body);
  return createdResponse(res, subscription, 'Subscription created successfully');
});

/**
 * Get all subscriptions
 * GET /api/subscriptions
 */
exports.getAllSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit, status, customerId, sortBy, sortOrder } = req.query;

  const result = await subscriptionService.getAllSubscriptions({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    customerId,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'Subscriptions retrieved successfully');
});

/**
 * Get subscription by ID
 * GET /api/subscriptions/:id
 */
exports.getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getSubscriptionById(req.params.id);
  return successResponse(res, subscription, 'Subscription retrieved successfully');
});

/**
 * Update subscription
 * PUT /api/subscriptions/:id
 */
exports.updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.updateSubscription(
    req.params.id,
    req.body
  );
  return successResponse(res, subscription, 'Subscription updated successfully');
});

/**
 * Change subscription plan
 * POST /api/subscriptions/:id/change-plan
 */
exports.changeSubscriptionPlan = asyncHandler(async (req, res) => {
  const { ratePlanId, effective } = req.body;
  const subscription = await subscriptionService.changeSubscriptionPlan(
    req.params.id,
    ratePlanId,
    effective
  );
  return successResponse(res, subscription, 'Subscription plan changed successfully');
});

/**
 * Cancel subscription
 * POST /api/subscriptions/:id/cancel
 */
exports.cancelSubscription = asyncHandler(async (req, res) => {
  const { immediate, reason } = req.body;
  const subscription = await subscriptionService.cancelSubscription(
    req.params.id,
    immediate,
    reason
  );
  return successResponse(res, subscription, 'Subscription cancelled successfully');
});

/**
 * Suspend subscription
 * POST /api/subscriptions/:id/suspend
 */
exports.suspendSubscription = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const subscription = await subscriptionService.suspendSubscription(
    req.params.id,
    reason
  );
  return successResponse(res, subscription, 'Subscription suspended successfully');
});

/**
 * Activate subscription
 * POST /api/subscriptions/:id/activate
 */
exports.activateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.activateSubscription(req.params.id);
  return successResponse(res, subscription, 'Subscription activated successfully');
});

/**
 * Get subscription usage
 * GET /api/subscriptions/:id/usage
 */
exports.getSubscriptionUsage = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.query;
  const usage = await subscriptionService.getSubscriptionUsage(
    req.params.id,
    periodStart,
    periodEnd
  );
  return successResponse(res, usage, 'Subscription usage retrieved successfully');
});

/**
 * Update subscription usage
 * POST /api/subscriptions/:id/usage
 */
exports.updateSubscriptionUsage = asyncHandler(async (req, res) => {
  const usage = await subscriptionService.updateSubscriptionUsage(
    req.params.id,
    req.body
  );
  return successResponse(res, usage, 'Subscription usage updated successfully');
});

/**
 * Renew subscription
 * POST /api/subscriptions/:id/renew
 */
exports.renewSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.renewSubscription(req.params.id);
  return successResponse(res, subscription, 'Subscription renewed successfully');
});

/**
 * Get customer subscriptions
 * GET /api/customers/:customerId/subscriptions
 */
exports.getCustomerSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionService.getCustomerSubscriptions(
    req.params.customerId
  );
  return successResponse(
    res,
    subscriptions,
    'Customer subscriptions retrieved successfully'
  );
});

module.exports = exports;
