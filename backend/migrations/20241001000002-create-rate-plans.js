'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rate_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      planType: {
        type: Sequelize.ENUM('prepaid', 'postpaid'),
        defaultValue: 'prepaid',
        allowNull: false,
      },
      monthlyPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      annualPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      setupFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      includedMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      includedDIDs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      maxConcurrentCalls: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      overageRatePerMinute: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: false,
      },
      didMonthlyRate: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('rate_plans', ['name']);
    await queryInterface.addIndex('rate_plans', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rate_plans');
  },
};
