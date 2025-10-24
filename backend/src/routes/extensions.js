/**
 * Extension Routes
 * Routes for extension management and Kamailio synchronization
 */

const express = require('express');
const router = express.Router();
const extensionController = require('../controllers/extensionController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateExtension, validateExtensionUpdate } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Get all extensions (admin only)
router.get(
  '/',
  requireRole('admin'),
  extensionController.getAllExtensions
);

// Get all extensions for a tenant (admin/support only)
router.get(
  '/tenant/:tenantId',
  requireRole('admin', 'support'),
  extensionController.getExtensions
);

// Get extension by ID
router.get('/:id', extensionController.getExtension);

// Create new extension (admin/support only)
router.post(
  '/',
  requireRole('admin', 'support'),
  // validateExtension, // Temporarily disabled for debugging
  extensionController.createExtension
);

// Update extension (admin/support only)
router.put(
  '/:id',
  requireRole('admin', 'support'),
  validateExtensionUpdate,
  extensionController.updateExtension
);

// Delete extension (admin/support only)
router.delete(
  '/:id',
  requireRole('admin', 'support'),
  extensionController.deleteExtension
);

// Get extension registration status
router.get('/:id/register-status', extensionController.getExtensionRegistrationStatus);

// Get extension active calls
router.get('/:id/call-status', extensionController.getExtensionActiveCalls);

// Sync extension to Kamailio/FreeSWITCH (admin/support only)
router.post(
  '/:id/sync',
  requireRole('admin', 'support'),
  extensionController.syncExtension
);

// Reset extension password (admin/support only)
router.post(
  '/:id/reset-password',
  requireRole('admin', 'support'),
  extensionController.resetExtensionPassword
);

// Sync tenant extensions to Kamailio (admin/support only)
router.post(
  '/tenant/:tenantId/sync',
  requireRole('admin', 'support'),
  extensionController.syncTenantExtensions
);

// Sync single extension (admin/support only)
router.post(
  '/:id/sync',
  requireRole('admin', 'support'),
  extensionController.syncExtension
);

module.exports = router;