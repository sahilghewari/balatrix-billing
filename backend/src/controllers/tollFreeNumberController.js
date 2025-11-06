/**
 * TollFreeNumber Controller
 * API endpoints for toll-free number management
 */

const { asyncHandler } = require('../utils/asyncHandler');
const tollFreeNumberService = require('../services/tollFreeNumberService');
const { successResponse, createdResponse } = require('../utils/responseHandler');

/**
 * Get available toll-free numbers
 * GET /api/toll-free-numbers/available
 */
exports.getAvailableNumbers = asyncHandler(async (req, res) => {
  const { limit, offset, search } = req.query;

  const result = await tollFreeNumberService.getAvailableNumbers({
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0,
    search,
  });

  return successResponse(res, result, 'Available toll-free numbers retrieved successfully');
});

/**
 * Assign toll-free number to customer
 * POST /api/customers/:customerId/toll-free-numbers
 */
exports.assignNumberToCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { numberId } = req.body;

  if (!numberId) {
    return res.status(400).json({
      success: false,
      message: 'numberId is required',
    });
  }

  const result = await tollFreeNumberService.assignNumberToCustomer(customerId, numberId);

  return createdResponse(res, result, 'Toll-free number assigned successfully');
});

/**
 * Get customer's assigned toll-free numbers
 * GET /api/customers/:customerId/toll-free-numbers
 */
exports.getCustomerNumbers = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  const result = await tollFreeNumberService.getCustomerNumbers(customerId);

  return successResponse(res, result, 'Customer toll-free numbers retrieved successfully');
});

/**
 * Get current user's assigned toll-free numbers
 * GET /api/toll-free-numbers/my-numbers
 */
exports.getMyNumbers = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Get user's customer record
  const { Customer } = require('../models');
  const customer = await Customer.findOne({
    where: { userId },
  });

  if (!customer) {
    return successResponse(res, [], 'No customer record found');
  }

  const result = await tollFreeNumberService.getCustomerNumbers(customer.id);

  return successResponse(res, result, 'Your toll-free numbers retrieved successfully');
});

/**
 * Unassign toll-free number
 * DELETE /api/toll-free-numbers/:numberId/assignment
 */
exports.unassignNumber = asyncHandler(async (req, res) => {
  const { numberId } = req.params;

  const result = await tollFreeNumberService.unassignNumber(numberId);

  return successResponse(res, result, 'Toll-free number unassigned successfully');
});

module.exports = exports;
