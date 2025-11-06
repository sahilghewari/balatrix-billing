/**
 * Account Model
 * Customer account balance and transaction tracking (prepaid/postpaid)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ACCOUNT_TYPES } = require('../utils/constants');

const Account = sequelize.define(
  'Account',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    accountType: {
      type: DataTypes.ENUM(...Object.values(ACCOUNT_TYPES)),
      allowNull: false,
      defaultValue: ACCOUNT_TYPES.POSTPAID,
    },
    // Balance tracking
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Low balance thresholds
    lowBalanceThreshold: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 100.0,
    },
    criticalBalanceThreshold: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 50.0,
    },
    // Status
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'closed'),
      defaultValue: 'active',
    },
    // Auto-recharge settings (for prepaid)
    autoRecharge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    autoRechargeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    autoRechargeThreshold: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    // Currency
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    // Billing cycle
    billingCycleDay: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 28,
      },
    },
    lastBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Statistics
    totalRecharge: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    totalSpent: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    lastRechargeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastRechargeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'accounts',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    indexes: [
      { fields: ['customerId'] },
      { fields: ['accountNumber'], unique: true },
      { fields: ['accountType'] },
      { fields: ['status'] },
      { fields: ['balance'] },
      { fields: ['nextBillingDate'] },
    ],
  }
);

// Instance methods
Account.prototype.isActive = function () {
  return this.status === 'active';
};

Account.prototype.isPrepaid = function () {
  return this.accountType === ACCOUNT_TYPES.PREPAID;
};

Account.prototype.isPostpaid = function () {
  return this.accountType === ACCOUNT_TYPES.POSTPAID;
};

Account.prototype.hasSufficientBalance = function (amount) {
  if (this.isPrepaid()) {
    return parseFloat(this.balance) >= parseFloat(amount);
  }
  // For postpaid, check credit limit
  return parseFloat(this.balance) + parseFloat(this.creditLimit) >= parseFloat(amount);
};

Account.prototype.isLowBalance = function () {
  return parseFloat(this.balance) <= parseFloat(this.lowBalanceThreshold);
};

Account.prototype.isCriticalBalance = function () {
  return parseFloat(this.balance) <= parseFloat(this.criticalBalanceThreshold);
};

Account.prototype.addBalance = async function (amount, description = 'Balance added') {
  this.balance = parseFloat(this.balance) + parseFloat(amount);
  this.totalRecharge = parseFloat(this.totalRecharge) + parseFloat(amount);
  this.lastRechargeDate = new Date();
  this.lastRechargeAmount = parseFloat(amount);
  await this.save();

  // Create transaction record
  const AccountTransaction = require('./AccountTransaction');
  await AccountTransaction.create({
    accountId: this.accountId,
    type: 'credit',
    amount: parseFloat(amount),
    balanceBefore: parseFloat(this.balance) - parseFloat(amount),
    balanceAfter: parseFloat(this.balance),
    description,
  });

  return this;
};

Account.prototype.deductBalance = async function (amount, description = 'Balance deducted') {
  const balanceBefore = parseFloat(this.balance);
  this.balance = balanceBefore - parseFloat(amount);
  this.totalSpent = parseFloat(this.totalSpent) + parseFloat(amount);
  await this.save();

  // Create transaction record
  const AccountTransaction = require('./AccountTransaction');
  await AccountTransaction.create({
    accountId: this.accountId,
    type: 'debit',
    amount: parseFloat(amount),
    balanceBefore,
    balanceAfter: parseFloat(this.balance),
    description,
  });

  return this;
};

Account.prototype.updateNextBillingDate = async function () {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(this.billingCycleDay);
  this.nextBillingDate = date;
  await this.save();
};

module.exports = Account;
