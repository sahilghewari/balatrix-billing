'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add criticalBalanceThreshold column to accounts table
    await queryInterface.addColumn('accounts', 'criticalBalanceThreshold', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 50.0,
      allowNull: true,
    });

    // Also add other missing columns that might be in the model
    // Check if billingCycleDay exists, if not add it
    const tableDescription = await queryInterface.describeTable('accounts');
    
    if (!tableDescription.billingCycleDay) {
      await queryInterface.addColumn('accounts', 'billingCycleDay', {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: true,
      });
    }

    if (!tableDescription.totalRecharge) {
      await queryInterface.addColumn('accounts', 'totalRecharge', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.0,
        allowNull: true,
      });
    }

    if (!tableDescription.totalSpent) {
      await queryInterface.addColumn('accounts', 'totalSpent', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.0,
        allowNull: true,
      });
    }

    if (!tableDescription.lastRechargeDate) {
      await queryInterface.addColumn('accounts', 'lastRechargeDate', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.lastRechargeAmount) {
      await queryInterface.addColumn('accounts', 'lastRechargeAmount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
    }

    if (!tableDescription.metadata) {
      await queryInterface.addColumn('accounts', 'metadata', {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('accounts', 'criticalBalanceThreshold');
    await queryInterface.removeColumn('accounts', 'billingCycleDay');
    await queryInterface.removeColumn('accounts', 'totalRecharge');
    await queryInterface.removeColumn('accounts', 'totalSpent');
    await queryInterface.removeColumn('accounts', 'lastRechargeDate');
    await queryInterface.removeColumn('accounts', 'lastRechargeAmount');
    await queryInterface.removeColumn('accounts', 'metadata');
  },
};
