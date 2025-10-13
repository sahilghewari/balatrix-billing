/**
 * Usage Controller
 * Handle subscription usage tracking endpoints
 */

const usageService = require('../services/usageService');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class UsageController {
  /**
   * Get current usage for a subscription
   * GET /api/subscriptions/:id/usage
   */
  async getCurrentUsage(req, res, next) {
    try {
      const { id: subscriptionId } = req.params;
      const userId = req.user.id;

      const usage = await usageService.getCurrentUsage(subscriptionId, userId);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      logger.error('Error fetching current usage', { error, subscriptionId: req.params.id });
      next(error);
    }
  }

  /**
   * Get usage history for a subscription
   * GET /api/subscriptions/:id/usage/history
   */
  async getUsageHistory(req, res, next) {
    try {
      const { id: subscriptionId } = req.params;
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const history = await usageService.getUsageHistory(
        subscriptionId,
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error fetching usage history', { error, subscriptionId: req.params.id });
      next(error);
    }
  }

  /**
   * Get usage summary (aggregated stats)
   * GET /api/subscriptions/:id/usage/summary
   */
  async getUsageSummary(req, res, next) {
    try {
      const { id: subscriptionId } = req.params;
      const userId = req.user.id;

      const summary = await usageService.getUsageSummary(subscriptionId, userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error fetching usage summary', { error, subscriptionId: req.params.id });
      next(error);
    }
  }
}

module.exports = new UsageController();
