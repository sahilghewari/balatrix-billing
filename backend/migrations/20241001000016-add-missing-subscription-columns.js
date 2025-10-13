'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to subscriptions table
    await queryInterface.addColumn('subscriptions', 'billingAmount', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    await queryInterface.addColumn('subscriptions', 'currency', {
      type: Sequelize.STRING(3),
      defaultValue: 'INR',
      allowNull: false,
    });

    await queryInterface.addColumn('subscriptions', 'razorpaySubscriptionId', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('subscriptions', 'stripeSubscriptionId', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('subscriptions', 'discountPercent', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.0,
      allowNull: false,
    });

    await queryInterface.addColumn('subscriptions', 'discountAmount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0.0,
      allowNull: false,
    });

    await queryInterface.addColumn('subscriptions', 'couponCode', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('subscriptions', 'renewalAttempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('subscriptions', 'lastRenewalAttempt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Update subscriptionNumber to allow longer values
    await queryInterface.changeColumn('subscriptions', 'subscriptionNumber', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });

    // Update status enum to include 'pending'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_subscriptions_status" ADD VALUE IF NOT EXISTS 'pending';
    `);

    // Update billingCycle enum to include 'quarterly'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_subscriptions_billingCycle" ADD VALUE IF NOT EXISTS 'quarterly';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('subscriptions', 'billingAmount');
    await queryInterface.removeColumn('subscriptions', 'currency');
    await queryInterface.removeColumn('subscriptions', 'razorpaySubscriptionId');
    await queryInterface.removeColumn('subscriptions', 'stripeSubscriptionId');
    await queryInterface.removeColumn('subscriptions', 'discountPercent');
    await queryInterface.removeColumn('subscriptions', 'discountAmount');
    await queryInterface.removeColumn('subscriptions', 'couponCode');
    await queryInterface.removeColumn('subscriptions', 'renewalAttempts');
    await queryInterface.removeColumn('subscriptions', 'lastRenewalAttempt');

    // Revert subscriptionNumber length
    await queryInterface.changeColumn('subscriptions', 'subscriptionNumber', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
    });
  }
};
