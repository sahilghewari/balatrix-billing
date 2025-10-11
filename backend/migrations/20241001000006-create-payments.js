'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
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
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      invoiceId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      paymentNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'bank_transfer'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'),
        defaultValue: 'pending',
        allowNull: false,
      },
      gateway: {
        type: Sequelize.ENUM('razorpay', 'stripe', 'manual'),
        allowNull: false,
      },
      gatewayPaymentId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      gatewayOrderId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      gatewaySignature: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refundedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      refundReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lastRetryAt: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('payments', ['customerId']);
    await queryInterface.addIndex('payments', ['accountId']);
    await queryInterface.addIndex('payments', ['subscriptionId']);
    await queryInterface.addIndex('payments', ['invoiceId']);
    await queryInterface.addIndex('payments', ['paymentNumber']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['gateway']);
    await queryInterface.addIndex('payments', ['gatewayPaymentId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  },
};
