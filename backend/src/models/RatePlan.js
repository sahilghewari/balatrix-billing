/**
 * Rate Plan Model
 * Predefined subscription plans with pricing
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SUBSCRIPTION_PLANS, BILLING_CYCLES } = require('../utils/constants');

const RatePlan = sequelize.define(
  'RatePlan',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    planCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false, // Index defined separately
      field: 'plan_code',
    },
    planName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    planType: {
      type: DataTypes.ENUM('starter', 'professional', 'callCenter', 'custom'),
      allowNull: false,
    },
    // Pricing
    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    annualPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    // Features and limits
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'tollFreeNumbers, freeMinutes, extensions, perMinuteCharge',
    },
    limits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'maxTollFreeNumbers, maxExtensions, monthlyMinuteAllowance',
    },
    // Billing configuration
    billingCycle: {
      type: DataTypes.ENUM(...Object.values(BILLING_CYCLES)),
      defaultValue: BILLING_CYCLES.MONTHLY,
    },
    trialDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    setupFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether plan is visible to customers',
    },
    // Display
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'rate_plans',
    timestamps: true,
    indexes: [
      { fields: ['plan_code'], unique: true },
      { fields: ['plan_type'] },
      { fields: ['is_active'] },
      { fields: ['is_public'] },
      { fields: ['display_order'] },
    ],
  }
);

// Class methods
RatePlan.getDefaultPlans = function () {
  return Object.values(SUBSCRIPTION_PLANS);
};

// Instance methods
RatePlan.prototype.calculatePrice = function (billingCycle = BILLING_CYCLES.MONTHLY) {
  if (billingCycle === BILLING_CYCLES.ANNUAL && this.annualPrice) {
    return parseFloat(this.annualPrice);
  }
  if (billingCycle === BILLING_CYCLES.QUARTERLY) {
    return parseFloat(this.monthlyPrice) * 3;
  }
  return parseFloat(this.monthlyPrice);
};

RatePlan.prototype.hasFeature = function (featureName) {
  return this.features && featureName in this.features;
};

RatePlan.prototype.getFeatureValue = function (featureName) {
  return this.features?.[featureName] || null;
};

RatePlan.prototype.getLimit = function (limitName) {
  return this.limits?.[limitName] || 0;
};

module.exports = RatePlan;
