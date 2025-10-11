'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_methods', {
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
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'),
        allowNull: false,
      },
      gateway: {
        type: Sequelize.ENUM('razorpay', 'stripe'),
        allowNull: false,
      },
      gatewayPaymentMethodId: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      last4: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      cardBrand: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      expiryMonth: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expiryYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bankName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      upiId: {
        type: Sequelize.STRING(100),
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
    await queryInterface.addIndex('payment_methods', ['customerId']);
    await queryInterface.addIndex('payment_methods', ['gatewayPaymentMethodId']);
    await queryInterface.addIndex('payment_methods', ['isDefault']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_methods');
  },
};
