/**
 * Account Transaction Model
 * Track all balance changes (credits and debits)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccountTransaction = sequelize.define(
  'AccountTransaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit', 'refund', 'adjustment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of related entity (payment, invoice, cdr, etc.)',
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of related entity',
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'account_transactions',
    timestamps: true,
    updatedAt: false, // Transactions are immutable once created
    indexes: [
      { fields: ['accountId'] },
      { fields: ['type'] },
      { fields: ['referenceType', 'referenceId'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = AccountTransaction;
