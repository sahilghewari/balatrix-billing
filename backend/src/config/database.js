/**
 * Database Configuration
 * PostgreSQL connection with Sequelize ORM
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Helper function to create Sequelize instance
const createSequelizeInstance = (dbName, dbUser, dbPassword, dbHost, dbPort, poolConfig) => {
  return new Sequelize(
    dbName,
    dbUser,
    String(dbPassword || ''),
    {
      host: dbHost,
      port: dbPort || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: poolConfig,
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
};

// Main database (billing)
const sequelize = createSequelizeInstance(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_HOST,
  process.env.DB_PORT,
  {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
  }
);

// Kamailio database
const kamailioSequelize = createSequelizeInstance(
  process.env.KAMAILIO_DB_NAME,
  process.env.KAMAILIO_DB_USER,
  process.env.KAMAILIO_DB_PASSWORD,
  process.env.KAMAILIO_DB_HOST,
  process.env.KAMAILIO_DB_PORT,
  {
    max: parseInt(process.env.KAMAILIO_DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.KAMAILIO_DB_POOL_MIN, 10) || 2,
    acquire: parseInt(process.env.KAMAILIO_DB_POOL_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.KAMAILIO_DB_POOL_IDLE, 10) || 10000,
  }
);

// FreeSWITCH database
const freeswitchSequelize = createSequelizeInstance(
  process.env.FREESWITCH_DB_NAME,
  process.env.FREESWITCH_DB_USER,
  process.env.FREESWITCH_DB_PASSWORD,
  process.env.FREESWITCH_DB_HOST,
  process.env.FREESWITCH_DB_PORT,
  {
    max: parseInt(process.env.FREESWITCH_DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.FREESWITCH_DB_POOL_MIN, 10) || 2,
    acquire: parseInt(process.env.FREESWITCH_DB_POOL_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.FREESWITCH_DB_POOL_IDLE, 10) || 10000,
  }
);

// Test database connection
const testConnection = async () => {
  const databases = [
    { name: 'Main', instance: sequelize },
    { name: 'Kamailio', instance: kamailioSequelize },
    { name: 'FreeSWITCH', instance: freeswitchSequelize },
  ];

  let allConnected = true;

  for (const db of databases) {
    try {
      await db.instance.authenticate();
      logger.info(`${db.name} database connection established successfully`);
    } catch (error) {
      logger.error(`Unable to connect to ${db.name} database:`, error);
      allConnected = false;
    }
  }

  return allConnected;
};

// Sync database models
// NOTE: Sync disabled - we use migrations instead to avoid schema conflicts
const syncDatabase = async (options = {}) => {
  const databases = [
    { name: 'Main', instance: sequelize },
    { name: 'Kamailio', instance: kamailioSequelize },
    { name: 'FreeSWITCH', instance: freeswitchSequelize },
  ];

  for (const db of databases) {
    try {
      // await db.instance.sync(options);
      logger.info(`${db.name} database sync skipped - using migrations for schema management`);
    } catch (error) {
      logger.error(`${db.name} database sync failed:`, error);
      throw error;
    }
  }
};

// Close database connections
const closeConnection = async () => {
  const databases = [
    { name: 'Main', instance: sequelize },
    { name: 'Kamailio', instance: kamailioSequelize },
    { name: 'FreeSWITCH', instance: freeswitchSequelize },
  ];

  for (const db of databases) {
    try {
      await db.instance.close();
      logger.info(`${db.name} database connection closed`);
    } catch (error) {
      logger.error(`Error closing ${db.name} database connection:`, error);
    }
  }
};

module.exports = {
  sequelize,
  kamailioSequelize,
  freeswitchSequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
