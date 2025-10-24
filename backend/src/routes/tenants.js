/**
 * Tenant Routes
 * Routes for tenant management
 */

const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiting');

/**
 * Tenant management routes (Admin only)
 */

// Create tenant
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  tenantController.createTenant
);

// Get all tenants
router.get(
  '/',
  authenticate,
  requireRole('admin', 'support'),
  tenantController.getAllTenants
);

// Get tenant by ID
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'support'),
  tenantController.getTenantById
);

// Update tenant
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  tenantController.updateTenant
);

/**
 * Extension management routes
 */

// Create extension for tenant
router.post(
  '/:tenantId/extensions',
  authenticate,
  requireRole('admin'),
  tenantController.createExtension
);

// Get tenant extensions
router.get(
  '/:tenantId/extensions',
  authenticate,
  requireRole('admin', 'support'),
  tenantController.getTenantExtensions
);

/**
 * Toll-free number management routes
 */

// Assign toll-free number to tenant
router.post(
  '/:tenantId/numbers',
  authenticate,
  requireRole('admin'),
  tenantController.assignTollFreeNumber
);

/**
 * Routing rule management routes
 */

// Create routing rule
router.post(
  '/:tenantId/routing-rules',
  authenticate,
  requireRole('admin'),
  tenantController.createRoutingRule
);

// Get tenant routing rules
router.get(
  '/:tenantId/routing-rules',
  authenticate,
  requireRole('admin', 'support'),
  tenantController.getTenantRoutingRules
);

module.exports = router;