/**
 * Invoice Routes
 * Routes for invoice management
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * Invoice generation routes (admin only)
 */

// Generate subscription invoice
router.post(
  '/generate/subscription/:subscriptionId',
  authenticate,
  requireRole(['admin']),
  invoiceController.generateSubscriptionInvoice
);

// Generate postpaid invoice
router.post(
  '/generate/postpaid/:accountId',
  authenticate,
  requireRole(['admin']),
  invoiceController.generatePostpaidInvoice
);

// Process billing cycle for all subscriptions
router.post(
  '/process-billing-cycle',
  authenticate,
  requireRole(['admin']),
  invoiceController.processBillingCycle
);

/**
 * Invoice retrieval routes
 */

// Get all invoices (admin/support only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  invoiceController.getAllInvoices
);

// Get overdue invoices
router.get(
  '/overdue',
  authenticate,
  requireRole(['admin', 'support']),
  invoiceController.getOverdueInvoices
);

// Get invoice statistics
router.get(
  '/statistics',
  authenticate,
  requireRole(['admin', 'support']),
  invoiceController.getInvoiceStatistics
);

// Get invoice by ID
router.get('/:id', authenticate, invoiceController.getInvoiceById);

/**
 * Invoice management routes
 */

// Mark invoice as paid (admin only)
router.post(
  '/:id/mark-paid',
  authenticate,
  requireRole(['admin']),
  invoiceController.markInvoiceAsPaid
);

// Void invoice (admin only)
router.post(
  '/:id/void',
  authenticate,
  requireRole(['admin']),
  invoiceController.voidInvoice
);

// Send invoice reminder
router.post(
  '/:id/reminder',
  authenticate,
  requireRole(['admin', 'support']),
  invoiceController.sendInvoiceReminder
);

module.exports = router;
