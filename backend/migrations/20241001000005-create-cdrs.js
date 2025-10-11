'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cdrs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      uuid: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
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
      callerId: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      destination: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      billableSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      callDirection: {
        type: Sequelize.ENUM('inbound', 'outbound'),
        allowNull: false,
      },
      callType: {
        type: Sequelize.ENUM('local', 'std', 'isd', 'mobile', 'toll_free'),
        allowNull: false,
      },
      callStatus: {
        type: Sequelize.ENUM('answered', 'no_answer', 'busy', 'failed', 'cancelled'),
        allowNull: false,
      },
      hangupCause: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      cost: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: false,
      },
      processingStatus: {
        type: Sequelize.ENUM('pending', 'processed', 'failed', 'retrying'),
        defaultValue: 'pending',
        allowNull: false,
      },
      processingError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      rawCDR: {
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
    await queryInterface.addIndex('cdrs', ['uuid']);
    await queryInterface.addIndex('cdrs', ['subscriptionId']);
    await queryInterface.addIndex('cdrs', ['accountId']);
    await queryInterface.addIndex('cdrs', ['callerId']);
    await queryInterface.addIndex('cdrs', ['destination']);
    await queryInterface.addIndex('cdrs', ['startTime']);
    await queryInterface.addIndex('cdrs', ['processingStatus']);
    await queryInterface.addIndex('cdrs', ['callType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cdrs');
  },
};
