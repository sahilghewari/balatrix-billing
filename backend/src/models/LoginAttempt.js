/**
 * Login Attempt Model
 * Track login attempts for security auditing
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoginAttempt = sequelize.define(
  'LoginAttempt',
  {
    attemptId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'locked', 'mfa_required', 'mfa_failed'),
      allowNull: false,
    },
    failureReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deviceFingerprint: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Geolocation data',
    },
    mfaUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attemptedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'login_attempts',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['ipAddress'] },
      { fields: ['attemptedAt'] },
    ],
  }
);

module.exports = LoginAttempt;
