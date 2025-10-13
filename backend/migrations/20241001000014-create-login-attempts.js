'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('login_attempts', {
      attemptId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'locked', 'mfa_required', 'mfa_failed'),
        allowNull: false,
      },
      failureReason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deviceFingerprint: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      location: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      mfaUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      attemptedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('login_attempts', ['userId']);
    await queryInterface.addIndex('login_attempts', ['email']);
    await queryInterface.addIndex('login_attempts', ['status']);
    await queryInterface.addIndex('login_attempts', ['ipAddress']);
    await queryInterface.addIndex('login_attempts', ['attemptedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('login_attempts');
  },
};
