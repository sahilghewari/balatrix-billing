/**
 * Test Database Connection
 */
require('dotenv').config();
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

const test = async () => {
  logger.info('Testing database connection...');
  logger.info(`DB_HOST: ${process.env.DB_HOST}`);
  logger.info(`DB_PORT: ${process.env.DB_PORT}`);
  logger.info(`DB_NAME: ${process.env.DB_NAME}`);
  logger.info(`DB_USER: ${process.env.DB_USER}`);
  
  const result = await testConnection();
  
  if (result) {
    logger.info('✅ Database connection successful!');
    process.exit(0);
  } else {
    logger.error('❌ Database connection failed!');
    process.exit(1);
  }
};

test();
