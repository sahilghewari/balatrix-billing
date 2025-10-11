/**
 * Database Configuration
 * PostgreSQL connection with Sequelize ORM
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'telecom_billing',
  process.env.DB_USER || 'postgres',
  String(process.env.DB_PASSWORD || ''),
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    define: {
      timestamps: true,
      underscored: false, // Set to false because migrations created camelCase columns
      freezeTableName: true,
    },
    dialectOptions: {
      timezone: 'Etc/GMT',
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
    benchmark: true,
    logQueryParameters: process.env.NODE_ENV === 'development',
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

// Sync database models
// NOTE: Sync disabled - we use migrations instead to avoid schema conflicts
const syncDatabase = async (options = {}) => {
  try {
    // await sequelize.sync(options);
    logger.info('Database sync skipped - using migrations for schema management');
  } catch (error) {
    logger.error('Database sync failed:', error);
    throw error;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
