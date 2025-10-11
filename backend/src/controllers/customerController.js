/**
 * Customer Controller
 * Handle customer-related HTTP requests
 */

const customerService = require('../services/customerService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  errorResponse,
} = require('../utils/responseHandler');

/**
 * Create new customer
 * POST /api/customers
 */
exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.userId);
  return createdResponse(res, customer, 'Customer created successfully');
});

/**
 * Get all customers
 * GET /api/customers
 */
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const { page, limit, status, search, sortBy, sortOrder } = req.query;

  const result = await customerService.getAllCustomers({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    search,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'Customers retrieved successfully');
});

/**
 * Get customer by ID
 * GET /api/customers/:id
 */
exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return successResponse(res, customer, 'Customer retrieved successfully');
});

/**
 * Get current user's customer profile
 * GET /api/customers/me
 */
exports.getMyCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerByUserId(req.userId);
  return successResponse(res, customer, 'Customer profile retrieved successfully');
});

/**
 * Update customer
 * PUT /api/customers/:id
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  return successResponse(res, customer, 'Customer updated successfully');
});

/**
 * Suspend customer
 * POST /api/customers/:id/suspend
 */
exports.suspendCustomer = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const customer = await customerService.suspendCustomer(req.params.id, reason);
  return successResponse(res, customer, 'Customer suspended successfully');
});

/**
 * Activate customer
 * POST /api/customers/:id/activate
 */
exports.activateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.activateCustomer(req.params.id);
  return successResponse(res, customer, 'Customer activated successfully');
});

/**
 * Delete customer
 * DELETE /api/customers/:id
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const result = await customerService.deleteCustomer(req.params.id);
  return successResponse(res, null, result.message);
});

/**
 * Get customer statistics
 * GET /api/customers/:id/statistics
 */
exports.getCustomerStatistics = asyncHandler(async (req, res) => {
  const stats = await customerService.getCustomerStatistics(req.params.id);
  return successResponse(res, stats, 'Customer statistics retrieved successfully');
});

/**
 * Get customer accounts
 * GET /api/customers/:id/accounts
 */
exports.getCustomerAccounts = asyncHandler(async (req, res) => {
  const accounts = await customerService.getCustomerAccounts(req.params.id);
  return successResponse(res, accounts, 'Customer accounts retrieved successfully');
});

/**
 * Create account for customer
 * POST /api/customers/:id/accounts
 */
exports.createAccount = asyncHandler(async (req, res) => {
  const account = await customerService.createAccount(req.params.id, req.body);
  return createdResponse(res, account, 'Account created successfully');
});

/**
 * Search customers
 * GET /api/customers/search
 */
exports.searchCustomers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const customers = await customerService.searchCustomers(q);
  return successResponse(res, customers, 'Search results retrieved successfully');
});

module.exports = exports;
