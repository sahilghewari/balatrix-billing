/**
 * CDR Routes
 * Routes for Call Detail Record processing
 */

const express = require('express');
const router = express.Router();
const cdrController = require('../controllers/cdrController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/auth');
const { cdrLimiter } = require('../middleware/rateLimiting');

/**
 * CDR submission routes
 */

// Submit single CDR (FreeSWITCH or internal systems)
router.post(
  '/',
  authenticate,
  cdrLimiter,
  validate(schemas.submitCDR, 'body'),
  cdrController.submitCDR
);

// Submit CDR batch
router.post(
  '/batch',
  authenticate,
  requireRole(['admin']),
  cdrLimiter,
  cdrController.submitCDRBatch
);

/**
 * CDR retrieval routes
 */

// Get all CDRs (admin/support only)
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'support']),
  cdrController.getAllCDRs
);

// Get CDR statistics
router.get(
  '/statistics',
  authenticate,
  requireRole(['admin', 'support']),
  cdrController.getCDRStatistics
);

// Export CDRs to CSV
router.get(
  '/export',
  authenticate,
  requireRole(['admin', 'support']),
  cdrController.exportCDRs
);

// Get call analytics
router.get(
  '/analytics',
  authenticate,
  requireRole(['admin', 'support']),
  cdrController.getCallAnalytics
);

// Get top destinations
router.get(
  '/top-destinations',
  authenticate,
  requireRole(['admin', 'support']),
  cdrController.getTopDestinations
);

// Get CDR by ID
router.get('/:id', authenticate, cdrController.getCDRById);

// Retry failed CDR (admin only)
router.post(
  '/:id/retry',
  authenticate,
  requireRole(['admin']),
  cdrController.retryFailedCDR
);

module.exports = router;
