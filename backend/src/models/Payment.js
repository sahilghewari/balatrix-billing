/**
 * Payment Model
 * Track all payment transactions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');

const Payment = sequelize.define(
  'Payment',
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    // Payment details
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      defaultValue: PAYMENT_STATUS.PENDING,
    },
    // Payment method
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
      allowNull: false,
    },
    paymentMethodId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payment_methods',
        key: 'methodId',
      },
    },
    // Gateway details
    gateway: {
      type: DataTypes.ENUM('razorpay', 'stripe', 'manual'),
      allowNull: false,
    },
    gatewayPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment ID from gateway',
    },
    gatewayOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Order ID from gateway',
    },
    gatewaySignature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Payment type
    paymentType: {
      type: DataTypes.ENUM('subscription', 'invoice', 'recharge', 'refund', 'adjustment'),
      allowNull: false,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Dates
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Failure details
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    failureCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Refund details
    refundAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // Transaction details
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Gateway response
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['customerId'] },
      { fields: ['subscriptionId'] },
      { fields: ['invoiceId'] },
      { fields: ['paymentNumber'], unique: true },
      { fields: ['status'] },
      { fields: ['paymentMethod'] },
      { fields: ['gateway'] },
      { fields: ['gatewayPaymentId'] },
      { fields: ['paymentType'] },
      { fields: ['paidAt'] },
      { fields: ['nextRetryAt'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
Payment.prototype.isSuccessful = function () {
  return this.status === PAYMENT_STATUS.SUCCESS;
};

Payment.prototype.isFailed = function () {
  return this.status === PAYMENT_STATUS.FAILED;
};

Payment.prototype.isPending = function () {
  return this.status === PAYMENT_STATUS.PENDING || this.status === PAYMENT_STATUS.PROCESSING;
};

Payment.prototype.markSuccess = async function (gatewayResponse) {
  this.status = PAYMENT_STATUS.SUCCESS;
  this.paidAt = new Date();
  this.gatewayResponse = gatewayResponse;
  await this.save();
};

Payment.prototype.markFailed = async function (reason, code, gatewayResponse) {
  this.status = PAYMENT_STATUS.FAILED;
  this.failedAt = new Date();
  this.failureReason = reason;
  this.failureCode = code;
  this.gatewayResponse = gatewayResponse;
  await this.save();
};

Payment.prototype.scheduleRetry = async function (delayMinutes = 60) {
  this.retryCount += 1;
  this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  this.status = PAYMENT_STATUS.PENDING;
  await this.save();
};

Payment.prototype.markRefunded = async function (refundAmount, reason, refundedBy) {
  this.status = PAYMENT_STATUS.REFUNDED;
  this.refundedAt = new Date();
  this.refundAmount = refundAmount || this.amount;
  this.refundReason = reason;
  this.refundedBy = refundedBy;
  await this.save();
};

module.exports = Payment;
