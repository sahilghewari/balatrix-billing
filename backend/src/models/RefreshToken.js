/**
 * Refresh Token Model
 * Store JWT refresh tokens for authentication
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: {
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
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['token'], unique: true },
      { fields: ['expiresAt'] },
    ],
  }
);

// Instance methods
RefreshToken.prototype.isValid = function () {
  return !this.isRevoked && this.expiresAt > new Date();
};

RefreshToken.prototype.revoke = async function () {
  this.isRevoked = true;
  await this.save();
};

module.exports = RefreshToken;
