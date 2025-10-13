/**
 * Usage Routes
 * Routes for subscription usage tracking
 */

const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get current usage
router.get('/:id/usage', usageController.getCurrentUsage);

// Get usage history
router.get('/:id/usage/history', usageController.getUsageHistory);

// Get usage summary
router.get('/:id/usage/summary', usageController.getUsageSummary);

module.exports = router;
