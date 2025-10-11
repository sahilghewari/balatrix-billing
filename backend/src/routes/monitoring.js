/**
 * Monitoring and Health Routes
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const sequelize = require('../config/database');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Error retrieving metrics', { error: error.message });
    res.status(500).send('Error retrieving metrics');
  }
});

/**
 * GET /metrics/json
 * Metrics in JSON format (for debugging)
 */
router.get('/metrics/json', async (req, res) => {
  try {
    const metrics = await monitoringService.getMetricsJSON();
    res.json(metrics);
  } catch (error) {
    logger.error('Error retrieving metrics JSON', { error: error.message });
    res.status(500).json({ error: 'Error retrieving metrics' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await monitoringService.healthCheck(sequelize, redisClient);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe (Kubernetes)
 */
router.get('/health/ready', async (req, res) => {
  try {
    const ready = await monitoringService.readinessCheck(sequelize);
    res.status(200).json(ready);
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/live
 * Liveness probe (Kubernetes)
 */
router.get('/health/live', (req, res) => {
  try {
    const liveness = monitoringService.livenessCheck();
    res.status(200).json(liveness);
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      status: 'not alive',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
