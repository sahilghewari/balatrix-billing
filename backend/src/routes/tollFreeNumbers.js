/**
 * Toll-Free Numbers Routes
 * Routes for toll-free number management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tollFreeNumberController = require('../controllers/tollFreeNumberController');

/**
 * Public routes (no auth required)
 */

/**
 * Get available toll-free numbers
 * GET /api/toll-free-numbers/available
 */
router.get('/available', tollFreeNumberController.getAvailableNumbers);

/**
 * Get current user's toll-free numbers
 * GET /api/toll-free-numbers/my-numbers
 */
router.get('/my-numbers', authenticate, tollFreeNumberController.getMyNumbers);

/**
 * Protected routes (auth required)
 */

/**
 * Unassign toll-free number
 * DELETE /api/toll-free-numbers/:numberId/assignment
 */
router.delete(
  '/:numberId/assignment',
  authenticate,
  tollFreeNumberController.unassignNumber
);

module.exports = router;
