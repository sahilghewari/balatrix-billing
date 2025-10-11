'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dids', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      didNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      countryCode: {
        type: Sequelize.STRING(5),
        allowNull: false,
      },
      didType: {
        type: Sequelize.ENUM('local', 'toll_free', 'mobile', 'national'),
        defaultValue: 'local',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('available', 'assigned', 'reserved', 'suspended', 'ported_out'),
        defaultValue: 'available',
        allowNull: false,
      },
      monthlyRate: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      setupFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      releasedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      forwardingNumber: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      features: {
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
    await queryInterface.addIndex('dids', ['subscriptionId']);
    await queryInterface.addIndex('dids', ['didNumber']);
    await queryInterface.addIndex('dids', ['status']);
    await queryInterface.addIndex('dids', ['country']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dids');
  },
};
