'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RoutingRule', {
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
        allowNull: false,
        defaultValue: true,
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('RoutingRule', ['tollFreeNumberId']);
    await queryInterface.addIndex('RoutingRule', ['tenantId']);
    await queryInterface.addIndex('RoutingRule', ['ruleType']);
    await queryInterface.addIndex('RoutingRule', ['priority']);
    await queryInterface.addIndex('RoutingRule', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop enum type first if dialect requires it
    await queryInterface.dropTable('RoutingRule');
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RoutingRule_ruleType"');
    } catch (err) {
      // ignore
    }
  },
};
