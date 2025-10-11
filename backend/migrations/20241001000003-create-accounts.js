'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      accountNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      accountType: {
        type: Sequelize.ENUM('prepaid', 'postpaid'),
        defaultValue: 'prepaid',
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      creditLimit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'closed'),
        defaultValue: 'active',
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      billingCycle: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'annual'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      billingDay: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      autoRecharge: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      autoRechargeAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      autoRechargeThreshold: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      lowBalanceAlert: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      lowBalanceThreshold: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 100,
        allowNull: false,
      },
      lastBillingDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextBillingDate: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.addIndex('accounts', ['customerId']);
    await queryInterface.addIndex('accounts', ['accountNumber']);
    await queryInterface.addIndex('accounts', ['status']);
    await queryInterface.addIndex('accounts', ['accountType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('accounts');
  },
};
