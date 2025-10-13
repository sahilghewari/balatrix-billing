/**
 * Subscription Usage Model
 * Track usage per subscription (minutes, numbers, extensions)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionUsage = sequelize.define(
  'SubscriptionUsage',
  {
    id: {
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
    billingPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'billingPeriodStart',
    },
    billingPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'billingPeriodEnd',
    },
    // Minutes usage
    minutesIncluded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    minutesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    minutesOverage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    overageCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    // Call types from migration
    localCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    stdCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isdCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    mobileCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: 'subscription_usage',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['subscriptionId'] },
      { fields: ['billingPeriodStart', 'billingPeriodEnd'] },
    ],
  }
);

// Instance methods
SubscriptionUsage.prototype.addMinutesUsage = async function (minutes, perMinuteRate) {
  this.minutesUsed += minutes;

  // Calculate overage
  if (this.minutesUsed > this.minutesIncluded) {
    this.minutesOverage = this.minutesUsed - this.minutesIncluded;
    this.overageCost = parseFloat(this.minutesOverage) * parseFloat(perMinuteRate);
  }

  await this.save();
};

SubscriptionUsage.prototype.getUsagePercentage = function () {
  if (this.minutesIncluded === 0) return 0;
  return (this.minutesUsed / this.minutesIncluded) * 100;
};

module.exports = SubscriptionUsage;
