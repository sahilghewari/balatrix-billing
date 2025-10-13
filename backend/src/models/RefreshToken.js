/**
 * Refresh Token Model
 * Store JWT refresh tokens for authentication
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    tokenId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Device tracking
    deviceFingerprint: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Rotation tracking
    replacedByToken: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'refresh_tokens',
        key: 'tokenId',
      },
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['token'], unique: true },
      { fields: ['expiresAt'] },
      { fields: ['isRevoked'] },
      { fields: ['deviceFingerprint'] },
    ],
  }
);

// Instance methods
RefreshToken.prototype.isValid = function () {
  return !this.isRevoked && this.expiresAt > new Date();
};

RefreshToken.prototype.revoke = async function () {
  this.isRevoked = true;
  this.revokedAt = new Date();
  await this.save();
};

module.exports = RefreshToken;
