/**
 * Test Database Helper
 * Manages test database lifecycle
 */

const { sequelize } = require('../../src/config/database');
const logger = require('../../src/utils/logger');

/**
 * Setup test database
 */
const setupTestDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    
    // Drop all tables
    await sequelize.drop();
    
    // Recreate all tables
    await sequelize.sync({ force: true });
    
    logger.info('Test database setup complete');
  } catch (error) {
    logger.error('Failed to setup test database:', error);
    throw error;
  }
};

/**
 * Teardown test database
 */
const teardownTestDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('Test database closed');
  } catch (error) {
    logger.error('Failed to close test database:', error);
    throw error;
  }
};

/**
 * Clean all tables
 */
const cleanDatabase = async () => {
  try {
    const models = Object.keys(sequelize.models);
    
    // Disable foreign key checks
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Truncate all tables
    for (const modelName of models) {
      await sequelize.models[modelName].destroy({
        where: {},
        force: true,
        truncate: true,
      });
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE');
    
    logger.info('Database cleaned');
  } catch (error) {
    logger.error('Failed to clean database:', error);
    throw error;
  }
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
};
