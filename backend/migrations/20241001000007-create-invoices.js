'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoices', {
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
      invoiceNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      invoiceType: {
        type: Sequelize.ENUM('subscription', 'postpaid', 'one_time', 'credit_note'),
        defaultValue: 'subscription',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'finalized', 'paid', 'partially_paid', 'overdue', 'void', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      paidAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      balanceAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      billingPeriodStart: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      billingPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      issueDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      paidDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lineItems: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      taxBreakdown: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      customerSnapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      termsAndConditions: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('invoices', ['customerId']);
    await queryInterface.addIndex('invoices', ['accountId']);
    await queryInterface.addIndex('invoices', ['subscriptionId']);
    await queryInterface.addIndex('invoices', ['invoiceNumber']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['dueDate']);
    await queryInterface.addIndex('invoices', ['issueDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoices');
  },
};
