/**
 * Subscription Model
 * Customer subscription to rate plans
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SUBSCRIPTION_STATUS, BILLING_CYCLES } = require('../utils/constants');

const Subscription = sequelize.define(
  'Subscription',
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
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rate_plans',
        key: 'id',
      },
    },
    // Subscription details
    subscriptionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SUBSCRIPTION_STATUS)),
      defaultValue: SUBSCRIPTION_STATUS.PENDING,
    },
    // Billing configuration
    billingCycle: {
      type: DataTypes.ENUM(...Object.values(BILLING_CYCLES)),
      defaultValue: BILLING_CYCLES.MONTHLY,
    },
    billingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    // Dates
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Cancellation
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Payment gateway references
    razorpaySubscriptionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Discount/Coupon
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Auto-renewal
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    renewalAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastRenewalAttempt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'subscriptions',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    indexes: [
      { fields: ['customerId'] },
      { fields: ['accountId'] },
      { fields: ['planId'] },
      { fields: ['subscriptionNumber'], unique: true },
      { fields: ['status'] },
      { fields: ['nextBillingDate'] },
      // { fields: ['razorpaySubscriptionId'] }, // Commented out - Razorpay not configured
      // { fields: ['stripeSubscriptionId'] }, // Commented out - Stripe not configured
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
Subscription.prototype.isActive = function () {
  return this.status === SUBSCRIPTION_STATUS.ACTIVE;
};

Subscription.prototype.isCancelled = function () {
  return this.status === SUBSCRIPTION_STATUS.CANCELLED;
};

Subscription.prototype.isExpired = function () {
  return this.status === SUBSCRIPTION_STATUS.EXPIRED || (this.endDate && this.endDate < new Date());
};

Subscription.prototype.isInTrial = function () {
  return this.trialEndDate && this.trialEndDate > new Date();
};

Subscription.prototype.activate = async function () {
  this.status = SUBSCRIPTION_STATUS.ACTIVE;
  if (!this.startDate) {
    this.startDate = new Date();
  }
  await this.updateBillingPeriod();
  await this.save();
};

Subscription.prototype.suspend = async function (reason) {
  this.status = SUBSCRIPTION_STATUS.SUSPENDED;
  this.metadata = { ...this.metadata, suspensionReason: reason };
  await this.save();
};

Subscription.prototype.cancel = async function (reason, immediate = false) {
  if (immediate) {
    this.status = SUBSCRIPTION_STATUS.CANCELLED;
    this.endDate = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
  }
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  await this.save();
};

Subscription.prototype.updateBillingPeriod = async function () {
  const now = new Date();
  this.currentPeriodStart = now;

  switch (this.billingCycle) {
    case BILLING_CYCLES.MONTHLY:
      this.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      this.nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      break;
    case BILLING_CYCLES.QUARTERLY:
      this.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      this.nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      break;
    case BILLING_CYCLES.ANNUAL:
      this.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      this.nextBillingDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      break;
    default:
      this.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      this.nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  await this.save();
};

Subscription.prototype.calculateFinalAmount = function () {
  let amount = parseFloat(this.billingAmount);

  if (this.discountPercent > 0) {
    amount -= (amount * parseFloat(this.discountPercent)) / 100;
  }

  if (this.discountAmount > 0) {
    amount -= parseFloat(this.discountAmount);
  }

  return Math.max(0, amount);
};

module.exports = Subscription;
