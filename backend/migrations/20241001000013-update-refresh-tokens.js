'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if tokenId column exists, if not rename id to tokenId
    const tableDescription = await queryInterface.describeTable('refresh_tokens');
    
    if (!tableDescription.tokenId && tableDescription.id) {
      // Rename id column to tokenId
      await queryInterface.renameColumn('refresh_tokens', 'id', 'tokenId');
    }
    
    // Add new columns if they don't exist
    if (!tableDescription.revokedAt) {
      await queryInterface.addColumn('refresh_tokens', 'revokedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    
    if (!tableDescription.deviceFingerprint) {
      await queryInterface.addColumn('refresh_tokens', 'deviceFingerprint', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    
    if (!tableDescription.replacedByToken) {
      await queryInterface.addColumn('refresh_tokens', 'replacedByToken', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'refresh_tokens',
          key: 'tokenId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    
    if (!tableDescription.metadata) {
      await queryInterface.addColumn('refresh_tokens', 'metadata', {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true,
      });
    }
    
    // Add indexes for new columns
    try {
      await queryInterface.addIndex('refresh_tokens', ['deviceFingerprint'], {
        name: 'refresh_tokens_device_fingerprint_idx',
      });
    } catch (error) {
      // Index might already exist
      console.log('Index refresh_tokens_device_fingerprint_idx might already exist');
    }
    
    try {
      await queryInterface.addIndex('refresh_tokens', ['isRevoked'], {
        name: 'refresh_tokens_is_revoked_idx',
      });
    } catch (error) {
      // Index might already exist
      console.log('Index refresh_tokens_is_revoked_idx might already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('refresh_tokens', 'metadata');
    await queryInterface.removeColumn('refresh_tokens', 'replacedByToken');
    await queryInterface.removeColumn('refresh_tokens', 'deviceFingerprint');
    await queryInterface.removeColumn('refresh_tokens', 'revokedAt');
    
    // Rename tokenId back to id
    await queryInterface.renameColumn('refresh_tokens', 'tokenId', 'id');
  },
};
