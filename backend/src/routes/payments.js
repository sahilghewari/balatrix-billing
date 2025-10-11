/**
 * Payment Routes
 * Routes for payment processing
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiting');

/**
 * Webhook routes (no authentication required)
 */

// Razorpay webhook
router.post('/webhooks/razorpay', paymentController.razorpayWebhook);

// Stripe webhook
router.post('/webhooks/stripe', paymentController.stripeWebhook);

/**
 * Payment routes (authenticated)
 */

// Create payment
router.post(
  '/',
  authenticate,
  paymentLimiter,
  validate(schemas.createPayment, 'body'),
  paymentController.createPayment
);

// Verify payment
router.post(
  '/:id/verify',
  authenticate,
  paymentLimiter,
  paymentController.verifyPayment
);

// Retry payment
router.post(
  '/:id/retry',
  authenticate,
  paymentLimiter,
  paymentController.retryPayment
);

// Refund payment (admin only)
router.post(
  '/:id/refund',
  authenticate,
  requireRole(['admin']),
  paymentController.refundPayment
);

// Get payment by ID
router.get('/:id', authenticate, paymentController.getPaymentById);

// Get all payments (admin/support only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  paymentController.getAllPayments
);

// Get payment statistics
router.get(
  '/statistics',
  authenticate,
  requireRole(['admin', 'support']),
  paymentController.getPaymentStatistics
);

module.exports = router;
