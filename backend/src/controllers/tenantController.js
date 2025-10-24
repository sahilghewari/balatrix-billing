/**
 * Tenant Controller
 * Handle tenant-related HTTP requests
 */

const tenantService = require('../services/tenantService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  errorResponse,
} = require('../utils/responseHandler');

/**
 * Create new tenant
 * POST /api/tenants
 */
exports.createTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.createTenant(req.body, req.userId);
  return createdResponse(res, tenant, 'Tenant created successfully');
});

/**
 * Get all tenants
 * GET /api/tenants
 */
exports.getAllTenants = asyncHandler(async (req, res) => {
  const { page, limit, status, search, sortBy, sortOrder } = req.query;

  const result = await tenantService.getAllTenants({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    search,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'Tenants retrieved successfully');
});

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
exports.getTenantById = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getTenantById(req.params.id);
  return successResponse(res, tenant, 'Tenant retrieved successfully');
});

/**
 * Update tenant
 * PUT /api/tenants/:id
 */
exports.updateTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.params.id, req.body, req.userId);
  return successResponse(res, tenant, 'Tenant updated successfully');
});

/**
 * Create extension for tenant
 * POST /api/tenants/:tenantId/extensions
 */
exports.createExtension = asyncHandler(async (req, res) => {
  const extension = await tenantService.createExtension(req.params.tenantId, req.body);
  return createdResponse(res, extension, 'Extension created successfully');
});

/**
 * Get tenant extensions
 * GET /api/tenants/:tenantId/extensions
 */
exports.getTenantExtensions = asyncHandler(async (req, res) => {
  const extensions = await tenantService.getTenantExtensions(req.params.tenantId);
  return successResponse(res, extensions, 'Extensions retrieved successfully');
});

/**
 * Assign toll-free number to tenant
 * POST /api/tenants/:tenantId/numbers
 */
exports.assignTollFreeNumber = asyncHandler(async (req, res) => {
  const tollFreeNumber = await tenantService.assignTollFreeNumber(req.params.tenantId, req.body);
  return createdResponse(res, tollFreeNumber, 'Toll-free number assigned successfully');
});

/**
 * Create routing rule
 * POST /api/tenants/:tenantId/routing-rules
 */
exports.createRoutingRule = asyncHandler(async (req, res) => {
  const routingRule = await tenantService.createRoutingRule(req.params.tenantId, req.body);
  return createdResponse(res, routingRule, 'Routing rule created successfully');
});

/**
 * Get tenant routing rules
 * GET /api/tenants/:tenantId/routing-rules
 */
exports.getTenantRoutingRules = asyncHandler(async (req, res) => {
  const routingRules = await tenantService.getTenantRoutingRules(req.params.tenantId);
  return successResponse(res, routingRules, 'Routing rules retrieved successfully');
});