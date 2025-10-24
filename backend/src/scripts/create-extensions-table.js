/**
 * Create Extensions Table in Kamailio Database
 * This script creates the Extensions table in the Kamailio PostgreSQL database
 */

// Load environment variables first
require('dotenv').config();

const { kamailioSequelize } = require('../config/database');
const logger = require('../utils/logger');

async function createExtensionsTable() {
  try {
    logger.info('Creating Extensions table in Kamailio database...');

    await kamailioSequelize.getQueryInterface().createTable('Extensions', {
      id: {
        type: kamailioSequelize.Sequelize.UUID,
        defaultValue: kamailioSequelize.Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: {
        type: kamailioSequelize.Sequelize.UUID,
        allowNull: false,
        comment: 'References Tenant in main database',
      },
      extension: {
        type: kamailioSequelize.Sequelize.STRING(50),
        allowNull: false,
      },
      password: {
        type: kamailioSequelize.Sequelize.STRING(255),
        allowNull: false,
      },
      domain: {
        type: kamailioSequelize.Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'sip.balatrix.com',
      },
      displayName: {
        type: kamailioSequelize.Sequelize.STRING(100),
        allowNull: true,
      },
      isActive: {
        type: kamailioSequelize.Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      config: {
        type: kamailioSequelize.Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      createdAt: {
        allowNull: false,
        type: kamailioSequelize.Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: kamailioSequelize.Sequelize.DATE,
      },
    });

    // Add indexes
    await kamailioSequelize.getQueryInterface().addIndex('Extensions', ['extension', 'domain'], { unique: true });
    await kamailioSequelize.getQueryInterface().addIndex('Extensions', ['tenantId']);
    await kamailioSequelize.getQueryInterface().addIndex('Extensions', ['isActive']);

    logger.info('Extensions table created successfully in Kamailio database');
  } catch (error) {
    logger.error('Error creating Extensions table in Kamailio database:', error);
    throw error;
  }
}

async function dropExtensionsTable() {
  try {
    logger.info('Dropping Extensions table from Kamailio database...');
    await kamailioSequelize.getQueryInterface().dropTable('Extensions');
    logger.info('Extensions table dropped successfully from Kamailio database');
  } catch (error) {
    logger.error('Error dropping Extensions table from Kamailio database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    createExtensionsTable()
      .then(() => {
        logger.info('Migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    dropExtensionsTable()
      .then(() => {
        logger.info('Migration rollback completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Migration rollback failed:', error);
        process.exit(1);
      });
  } else {
    logger.error('Usage: node create-extensions-table.js [up|down]');
    process.exit(1);
  }
}

module.exports = {
  createExtensionsTable,
  dropExtensionsTable,
};