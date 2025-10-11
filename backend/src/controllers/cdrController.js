/**
 * CDR Controller
 * Handle CDR-related HTTP requests
 */

const cdrProcessorService = require('../services/cdrProcessorService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
} = require('../utils/responseHandler');

/**
 * Submit CDR for processing
 * POST /api/cdrs
 */
exports.submitCDR = asyncHandler(async (req, res) => {
  const cdr = await cdrProcessorService.processCDR(req.body);
  return createdResponse(res, cdr, 'CDR processed successfully');
});

/**
 * Submit CDR batch
 * POST /api/cdrs/batch
 */
exports.submitCDRBatch = asyncHandler(async (req, res) => {
  const { cdrs } = req.body;
  const results = await cdrProcessorService.processCDRBatch(cdrs);
  return successResponse(res, results, 'CDR batch processed successfully');
});

/**
 * Get CDR by ID
 * GET /api/cdrs/:id
 */
exports.getCDRById = asyncHandler(async (req, res) => {
  const cdr = await cdrProcessorService.getCDRById(req.params.id);
  return successResponse(res, cdr, 'CDR retrieved successfully');
});

/**
 * Get all CDRs
 * GET /api/cdrs
 */
exports.getAllCDRs = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    accountId,
    startDate,
    endDate,
    direction,
    processingStatus,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await cdrProcessorService.getCDRs({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    direction,
    processingStatus,
    sortBy,
    sortOrder,
  });

  return successResponse(res, result, 'CDRs retrieved successfully');
});

/**
 * Get CDR statistics
 * GET /api/cdrs/statistics
 */
exports.getCDRStatistics = asyncHandler(async (req, res) => {
  const { accountId, startDate, endDate } = req.query;

  const stats = await cdrProcessorService.getCDRStatistics({
    accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return successResponse(res, stats, 'CDR statistics retrieved successfully');
});

/**
 * Retry failed CDR
 * POST /api/cdrs/:id/retry
 */
exports.retryFailedCDR = asyncHandler(async (req, res) => {
  const cdr = await cdrProcessorService.retryFailedCDR(req.params.id);
  return successResponse(res, cdr, 'CDR retry successful');
});

/**
 * Export CDRs to CSV
 * GET /api/cdrs/export
 */
exports.exportCDRs = asyncHandler(async (req, res) => {
  const { accountId, startDate, endDate } = req.query;

  const csv = await cdrProcessorService.exportCDRs({
    accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=cdrs.csv');
  return res.send(csv);
});

/**
 * Get call analytics
 * GET /api/cdrs/analytics
 */
exports.getCallAnalytics = asyncHandler(async (req, res) => {
  const { accountId, startDate, endDate, groupBy } = req.query;

  const analytics = await cdrProcessorService.getCallAnalytics({
    accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    groupBy: groupBy || 'day',
  });

  return successResponse(res, analytics, 'Call analytics retrieved successfully');
});

/**
 * Get top destinations
 * GET /api/cdrs/top-destinations
 */
exports.getTopDestinations = asyncHandler(async (req, res) => {
  const { accountId, startDate, endDate, limit } = req.query;

  const destinations = await cdrProcessorService.getTopDestinations({
    accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: parseInt(limit) || 10,
  });

  return successResponse(res, destinations, 'Top destinations retrieved successfully');
});

/**
 * Get account CDRs
 * GET /api/accounts/:accountId/cdrs
 */
exports.getAccountCDRs = asyncHandler(async (req, res) => {
  const { page, limit, startDate, endDate, direction } = req.query;

  const result = await cdrProcessorService.getCDRs({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    accountId: req.params.accountId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    direction,
  });

  return successResponse(res, result, 'Account CDRs retrieved successfully');
});

module.exports = exports;
