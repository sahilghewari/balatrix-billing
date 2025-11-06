/**
 * Customer Routes
 * Routes for customer management
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, requireRole, requireCustomerAccess } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiting');

/**
 * Public/Admin routes
 */

// Create customer (authenticated users can create)
router.post(
  '/',
  authenticate,
  validate(schemas.createCustomer, 'body'),
  customerController.createCustomer
);

// Get all customers (admin/support only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  customerController.getAllCustomers
);

// Search customers (admin/support only)
router.get(
  '/search',
  authenticate,
  requireRole(['admin', 'support']),
  customerController.searchCustomers
);

// Get current user's customer profile
router.get('/me', authenticate, customerController.getMyCustomer);

/**
 * Individual customer routes
 */

// Get customer by ID
router.get(
  '/:id',
  authenticate,
  requireCustomerAccess,
  customerController.getCustomerById
);

// Update customer
router.put(
  '/:id',
  authenticate,
  requireCustomerAccess,
  validate(schemas.updateCustomer, 'body'),
  customerController.updateCustomer
);

// Delete customer (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  customerController.deleteCustomer
);

// Suspend customer (admin/support only)
router.post(
  '/:id/suspend',
  authenticate,
  requireRole(['admin', 'support']),
  customerController.suspendCustomer
);

// Activate customer (admin/support only)
router.post(
  '/:id/activate',
  authenticate,
  requireRole(['admin', 'support']),
  customerController.activateCustomer
);

// Get customer statistics
router.get(
  '/:id/statistics',
  authenticate,
  requireCustomerAccess,
  customerController.getCustomerStatistics
);

/**
 * Customer accounts routes
 */

// Get customer accounts
router.get(
  '/:id/accounts',
  authenticate,
  requireCustomerAccess,
  customerController.getCustomerAccounts
);

// Create account for customer
router.post(
  '/:id/accounts',
  authenticate,
  requireCustomerAccess,
  customerController.createAccount
);

/**
 * Toll-Free Number routes for customers
 */
const tollFreeNumberController = require('../controllers/tollFreeNumberController');

// Assign toll-free number to customer
router.post(
  '/:customerId/toll-free-numbers',
  authenticate,
  requireCustomerAccess,
  tollFreeNumberController.assignNumberToCustomer
);

// Get customer's assigned toll-free numbers
router.get(
  '/:customerId/toll-free-numbers',
  authenticate,
  requireCustomerAccess,
  tollFreeNumberController.getCustomerNumbers
);

// Unassign toll-free number from customer
router.delete(
  '/:customerId/toll-free-numbers/:numberId',
  authenticate,
  requireCustomerAccess,
  tollFreeNumberController.unassignNumber
);

module.exports = router;
