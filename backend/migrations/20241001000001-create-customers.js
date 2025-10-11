'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      companyName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      businessType: {
        type: Sequelize.ENUM('individual', 'small_business', 'enterprise'),
        defaultValue: 'individual',
        allowNull: false,
      },
      gstin: {
        type: Sequelize.STRING(15),
        allowNull: true,
        unique: true,
      },
      pan: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      billingAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      billingCity: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      billingState: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      billingCountry: {
        type: Sequelize.STRING(100),
        defaultValue: 'India',
        allowNull: false,
      },
      billingPincode: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'pending', 'cancelled'),
        defaultValue: 'active',
        allowNull: false,
      },
      creditLimit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      kycStatus: {
        type: Sequelize.ENUM('pending', 'submitted', 'verified', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      kycDocuments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      taxExempt: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('customers', ['userId']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('customers', ['gstin']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customers');
  },
};
