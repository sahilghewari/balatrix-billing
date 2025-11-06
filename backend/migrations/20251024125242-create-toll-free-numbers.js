'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('TollFreeNumbers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: true, // Allow null for unassigned numbers
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'balatrix',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false,
      },
      monthlyCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      perMinuteCost: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0.0000,
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      activatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('TollFreeNumbers', ['number'], { unique: true });
    await queryInterface.addIndex('TollFreeNumbers', ['tenantId']);
    await queryInterface.addIndex('TollFreeNumbers', ['status']);
    await queryInterface.addIndex('TollFreeNumbers', ['provider']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('TollFreeNumbers');
  }
};
