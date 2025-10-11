/**
 * Invoice Controller
 * Handle invoice-related HTTP requests
 */

const billingService = require('../services/billingService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
} = require('../utils/responseHandler');

/**
 * Generate subscription invoice
 * POST /api/invoices/generate/subscription/:subscriptionId
 */
exports.generateSubscriptionInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.generateSubscriptionInvoice(
    req.params.subscriptionId
  );
  return createdResponse(res, invoice, 'Invoice generated successfully');
});

/**
 * Generate postpaid invoice
 * POST /api/invoices/generate/postpaid/:accountId
 */
exports.generatePostpaidInvoice = asyncHandler(async (req, res) => {
  const { periodStart, periodEnd } = req.body;
  const invoice = await billingService.generatePostpaidInvoice(
    req.params.accountId,
    new Date(periodStart),
    new Date(periodEnd)
  );
  return createdResponse(res, invoice, 'Postpaid invoice generated successfully');
});

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await billingService.getInvoiceById(req.params.id);
  return successResponse(res, invoice, 'Invoice retrieved successfully');
});

/**
 * Get all invoices
 * GET /api/invoices
 */
exports.getAllInvoices = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    customerId,
    status,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await billingService.getAllInvoices({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    customerId,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'Invoices retrieved successfully');
});

/**
 * Mark invoice as paid
 * POST /api/invoices/:id/mark-paid
 */
exports.markInvoiceAsPaid = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;
  const invoice = await billingService.markInvoiceAsPaid(req.params.id, paymentId);
  return successResponse(res, invoice, 'Invoice marked as paid successfully');
});

/**
 * Void invoice
 * POST /api/invoices/:id/void
 */
exports.voidInvoice = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const invoice = await billingService.voidInvoice(req.params.id, reason);
  return successResponse(res, invoice, 'Invoice voided successfully');
});

/**
 * Get overdue invoices
 * GET /api/invoices/overdue
 */
exports.getOverdueInvoices = asyncHandler(async (req, res) => {
  const invoices = await billingService.getOverdueInvoices();
  return successResponse(res, invoices, 'Overdue invoices retrieved successfully');
});

/**
 * Send invoice reminder
 * POST /api/invoices/:id/reminder
 */
exports.sendInvoiceReminder = asyncHandler(async (req, res) => {
  const result = await billingService.sendInvoiceReminder(req.params.id);
  return successResponse(res, null, result.message);
});

/**
 * Get invoice statistics
 * GET /api/invoices/statistics
 */
exports.getInvoiceStatistics = asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const stats = await billingService.getInvoiceStatistics({
    customerId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return successResponse(res, stats, 'Invoice statistics retrieved successfully');
});

/**
 * Get customer invoices
 * GET /api/customers/:customerId/invoices
 */
exports.getCustomerInvoices = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await billingService.getCustomerInvoices(req.params.customerId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
  });

  return successResponse(res, result, 'Customer invoices retrieved successfully');
});

/**
 * Process billing cycle
 * POST /api/invoices/process-billing-cycle
 */
exports.processBillingCycle = asyncHandler(async (req, res) => {
  const results = await billingService.processBillingCycle();
  return successResponse(res, results, 'Billing cycle processed successfully');
});

module.exports = exports;
