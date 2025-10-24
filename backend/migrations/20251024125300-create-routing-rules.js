'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('RoutingRules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tollFreeNumberId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TollFreeNumbers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ruleType: {
        type: Sequelize.ENUM('extension', 'ivr', 'queue', 'voicemail'),
        allowNull: false,
        defaultValue: 'extension',
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      conditions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      actions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
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
    await queryInterface.addIndex('RoutingRules', ['tollFreeNumberId']);
    await queryInterface.addIndex('RoutingRules', ['tenantId']);
    await queryInterface.addIndex('RoutingRules', ['ruleType']);
    await queryInterface.addIndex('RoutingRules', ['priority']);
    await queryInterface.addIndex('RoutingRules', ['isActive']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('RoutingRules');
  }
};
