'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subscriptions', {
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
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ratePlanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rate_plans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      subscriptionNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'cancelled', 'expired', 'trial'),
        defaultValue: 'active',
        allowNull: false,
      },
      billingCycle: {
        type: Sequelize.ENUM('monthly', 'annual'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      trialEndDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextBillingDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastBillingDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      currentPeriodStart: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      currentPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      autoRenew: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      cancelAtPeriodEnd: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancellationReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      addons: {
        type: Sequelize.JSONB,
        allowNull: true,
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
    await queryInterface.addIndex('subscriptions', ['customerId']);
    await queryInterface.addIndex('subscriptions', ['accountId']);
    await queryInterface.addIndex('subscriptions', ['ratePlanId']);
    await queryInterface.addIndex('subscriptions', ['subscriptionNumber']);
    await queryInterface.addIndex('subscriptions', ['status']);
    await queryInterface.addIndex('subscriptions', ['nextBillingDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subscriptions');
  },
};
