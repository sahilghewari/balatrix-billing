/**
 * Subscription Routes
 * Routes for subscription management
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const usageController = require('../controllers/usageController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, requireRole, requireCustomerAccess } = require('../middleware/auth');

/**
 * Subscription routes
 */

// Get current user's active subscription (must be before /:id routes)
router.get(
  '/my-subscription',
  authenticate,
  subscriptionController.getMySubscription
);

// Create subscription with payment (Razorpay) (must be before /:id routes)
router.post(
  '/create-with-payment',
  authenticate,
  subscriptionController.createSubscriptionWithPayment
);

// Verify payment and activate subscription (must be before /:id routes)
router.post(
  '/verify-payment',
  authenticate,
  subscriptionController.verifyPaymentAndActivate
);

// Create subscription
router.post(
  '/',
  authenticate,
  validate(schemas.createSubscription, 'body'),
  subscriptionController.createSubscription
);

// Get all subscriptions (admin/support only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  subscriptionController.getAllSubscriptions
);

// Get subscription by ID
router.get('/:id', authenticate, subscriptionController.getSubscriptionById);

// Update subscription
router.put(
  '/:id',
  authenticate,
  validate(schemas.updateSubscription, 'body'),
  subscriptionController.updateSubscription
);

// Change subscription plan
router.post(
  '/:id/change-plan',
  authenticate,
  subscriptionController.changeSubscriptionPlan
);

// Cancel subscription
router.post('/:id/cancel', authenticate, subscriptionController.cancelSubscription);

// Suspend subscription (admin/support only)
router.post(
  '/:id/suspend',
  authenticate,
  requireRole(['admin', 'support']),
  subscriptionController.suspendSubscription
);

// Activate subscription (admin/support only)
router.post(
  '/:id/activate',
  authenticate,
  requireRole(['admin', 'support']),
  subscriptionController.activateSubscription
);

// Get subscription usage
router.get('/:id/usage', authenticate, usageController.getCurrentUsage);

// Get subscription usage history
router.get('/:id/usage/history', authenticate, usageController.getUsageHistory);

// Get subscription usage summary
router.get('/:id/usage/summary', authenticate, usageController.getUsageSummary);

// Update subscription usage (internal/admin only)
router.post(
  '/:id/usage',
  authenticate,
  requireRole(['admin']),
  subscriptionController.updateSubscriptionUsage
);

// Renew subscription (admin only)
router.post(
  '/:id/renew',
  authenticate,
  requireRole(['admin']),
  subscriptionController.renewSubscription
);

module.exports = router;
