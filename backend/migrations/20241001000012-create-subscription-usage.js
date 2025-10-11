'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subscription_usage', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      billingPeriodStart: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      billingPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      minutesIncluded: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      minutesUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      minutesOverage: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      overageCost: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      localCalls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      stdCalls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      isdCalls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      mobileCalls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
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
    await queryInterface.addIndex('subscription_usage', ['subscriptionId']);
    await queryInterface.addIndex('subscription_usage', ['billingPeriodStart', 'billingPeriodEnd']);
    
    // Add unique constraint for subscription + billing period
    await queryInterface.addConstraint('subscription_usage', {
      fields: ['subscriptionId', 'billingPeriodStart'],
      type: 'unique',
      name: 'subscription_usage_subscription_period_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subscription_usage');
  },
};
