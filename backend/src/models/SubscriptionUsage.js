/**
 * Subscription Usage Model
 * Track usage per subscription (minutes, numbers, extensions)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionUsage = sequelize.define(
  'SubscriptionUsage',
  {
    usageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Billing period
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Minutes usage
    totalMinutesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    includedMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    overageMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    overageCharges: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Calls
    totalCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    successfulCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failedCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Toll-free numbers
    tollFreeNumbersUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tollFreeNumbersIncluded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tollFreeNumbersOverage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tollFreeNumbersCharges: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Extensions
    extensionsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    extensionsIncluded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    extensionsOverage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    extensionsCharges: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Total charges
    totalCharges: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Status
    isFinalized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    finalizedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'subscription_usage',
    timestamps: true,
    indexes: [
      { fields: ['subscriptionId'] },
      { fields: ['periodStart', 'periodEnd'] },
      { fields: ['isFinalized'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
SubscriptionUsage.prototype.addMinutesUsage = async function (minutes, perMinuteRate) {
  this.totalMinutesUsed += minutes;

  // Calculate overage
  if (this.totalMinutesUsed > this.includedMinutes) {
    this.overageMinutes = this.totalMinutesUsed - this.includedMinutes;
    this.overageCharges = parseFloat(this.overageMinutes) * parseFloat(perMinuteRate);
  }

  this.totalCalls += 1;
  this.successfulCalls += 1;
  await this.recalculateTotalCharges();
  await this.save();
};

SubscriptionUsage.prototype.addTollFreeNumber = async function (chargePerNumber = 1) {
  this.tollFreeNumbersUsed += 1;

  if (this.tollFreeNumbersUsed > this.tollFreeNumbersIncluded) {
    this.tollFreeNumbersOverage = this.tollFreeNumbersUsed - this.tollFreeNumbersIncluded;
    this.tollFreeNumbersCharges = parseFloat(this.tollFreeNumbersOverage) * parseFloat(chargePerNumber);
  }

  await this.recalculateTotalCharges();
  await this.save();
};

SubscriptionUsage.prototype.addExtension = async function (chargePerExtension = 1) {
  this.extensionsUsed += 1;

  if (this.extensionsUsed > this.extensionsIncluded) {
    this.extensionsOverage = this.extensionsUsed - this.extensionsIncluded;
    this.extensionsCharges = parseFloat(this.extensionsOverage) * parseFloat(chargePerExtension);
  }

  await this.recalculateTotalCharges();
  await this.save();
};

SubscriptionUsage.prototype.recalculateTotalCharges = async function () {
  this.totalCharges =
    parseFloat(this.overageCharges) +
    parseFloat(this.tollFreeNumbersCharges) +
    parseFloat(this.extensionsCharges);
};

SubscriptionUsage.prototype.finalize = async function () {
  this.isFinalized = true;
  this.finalizedAt = new Date();
  await this.save();
};

module.exports = SubscriptionUsage;
