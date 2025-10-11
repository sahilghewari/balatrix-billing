/**
 * System Log Model
 * Application-wide system event logging
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemLog = sequelize.define(
  'SystemLog',
  {
    logId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('error', 'warn', 'info', 'debug', 'alert'),
      allowNull: false,
      defaultValue: 'info',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'authentication, billing, payment, cdr, system, etc.',
    },
    message: {
      type: DataTypes.TEXT,
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
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
    stackTrace: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'system_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['level'] },
      { fields: ['category'] },
      { fields: ['userId'] },
      { fields: ['customerId'] },
      { fields: ['referenceType', 'referenceId'] },
      { fields: ['timestamp'] },
    ],
  }
);

module.exports = SystemLog;
