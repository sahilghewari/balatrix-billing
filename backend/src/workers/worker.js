/**
 * Worker Process
 * Starts background job processors
 */

require('dotenv').config();
const logger = require('../utils/logger');

// Initialize database connection
const { testConnection } = require('../config/database');

// Initialize job processors
require('./jobProcessors');

logger.info('Worker process started');

/**
 * Initialize worker
 */
const startWorker = async () => {
  try {
    // Test database connection
    await testConnection();
    logger.info('Worker: Database connected');

    // Workers are already started by importing jobProcessors
    logger.info('Worker: All job processors are running');
  } catch (error) {
    logger.error('Worker initialization failed:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Worker: ${signal} received. Starting graceful shutdown...`);

  try {
    const { sequelize } = require('../config/database');
    const { redisClient } = require('../config/redis');

    // Close database
    await sequelize.close();
    logger.info('Worker: Database connection closed');

    // Close Redis
    await redisClient.quit();
    logger.info('Worker: Redis connection closed');

    logger.info('Worker: Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Worker: Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Worker: Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Worker: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start worker
startWorker();
