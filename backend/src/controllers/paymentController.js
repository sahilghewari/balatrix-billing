/**
 * Payment Controller
 * Handle payment-related HTTP requests
 */

const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
} = require('../utils/responseHandler');

/**
 * Create new payment
 * POST /api/payments
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment(req.body);
  return createdResponse(res, result, 'Payment created successfully');
});

/**
 * Verify payment
 * POST /api/payments/:id/verify
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyPayment(req.params.id, req.body);
  return successResponse(res, payment, 'Payment verified successfully');
});

/**
 * Razorpay webhook
 * POST /api/payments/webhooks/razorpay
 */
exports.razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentService.processWebhook(
    'razorpay',
    JSON.stringify(req.body),
    signature
  );
  return successResponse(res, result, 'Webhook processed successfully');
});

/**
 * Stripe webhook
 * POST /api/payments/webhooks/stripe
 */
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await paymentService.processWebhook(
    'stripe',
    req.body,
    signature
  );
  return successResponse(res, result, 'Webhook processed successfully');
});

/**
 * Retry payment
 * POST /api/payments/:id/retry
 */
exports.retryPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.retryPayment(req.params.id);
  return successResponse(res, result, 'Payment retry initiated successfully');
});

/**
 * Refund payment
 * POST /api/payments/:id/refund
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await paymentService.refundPayment(req.params.id, amount, reason);
  return successResponse(res, payment, 'Payment refunded successfully');
});

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  return successResponse(res, payment, 'Payment retrieved successfully');
});

/**
 * Get all payments
 * GET /api/payments
 */
exports.getAllPayments = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    status,
    customerId,
    gateway,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await paymentService.getAllPayments({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    customerId,
    gateway,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'Payments retrieved successfully');
});

/**
 * Get customer payments
 * GET /api/customers/:customerId/payments
 */
exports.getCustomerPayments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await paymentService.getCustomerPayments(req.params.customerId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  return successResponse(res, result, 'Customer payments retrieved successfully');
});

/**
 * Get payment statistics
 * GET /api/payments/statistics
 */
exports.getPaymentStatistics = asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const stats = await paymentService.getPaymentStatistics({
    customerId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return successResponse(res, stats, 'Payment statistics retrieved successfully');
});

/**
 * Save payment method
 * POST /api/customers/:customerId/payment-methods
 */
exports.savePaymentMethod = asyncHandler(async (req, res) => {
  const paymentMethod = await paymentService.savePaymentMethod(
    req.params.customerId,
    req.body
  );
  return createdResponse(res, paymentMethod, 'Payment method saved successfully');
});

/**
 * Get customer payment methods
 * GET /api/customers/:customerId/payment-methods
 */
exports.getCustomerPaymentMethods = asyncHandler(async (req, res) => {
  const paymentMethods = await paymentService.getCustomerPaymentMethods(
    req.params.customerId
  );
  return successResponse(
    res,
    paymentMethods,
    'Payment methods retrieved successfully'
  );
});

/**
 * Delete payment method
 * DELETE /api/customers/:customerId/payment-methods/:id
 */
exports.deletePaymentMethod = asyncHandler(async (req, res) => {
  const result = await paymentService.deletePaymentMethod(
    req.params.id,
    req.params.customerId
  );
  return successResponse(res, null, result.message);
});

module.exports = exports;
