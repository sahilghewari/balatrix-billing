/**
 * Rate Plan Routes
 * Routes for rate plan management
 */

const express = require('express');
const router = express.Router();
const ratePlanController = require('../controllers/ratePlanController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * Rate Plan routes
 */

// Get public plans (no auth required for browsing)
router.get('/public', ratePlanController.getPublicPlans);

// Calculate price (no auth required for price preview)
router.post('/calculate-price', ratePlanController.calculatePrice);

// Get all plans (admin only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  ratePlanController.getAllPlans
);

// Get plan by ID
router.get('/:id', ratePlanController.getPlanById);

// Get plan by code
router.get('/code/:code', ratePlanController.getPlanByCode);

// Create plan (admin only)
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  ratePlanController.createPlan
);

// Update plan (admin only)
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  ratePlanController.updatePlan
);

// Delete plan (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  ratePlanController.deletePlan
);

module.exports = router;
