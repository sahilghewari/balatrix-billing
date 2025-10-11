/**
 * CDR (Call Detail Record) Model
 * Store and process call records from FreeSWITCH
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { CDR_STATUS } = require('../utils/constants');

const CDR = sequelize.define(
  'CDR',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'FreeSWITCH call UUID',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
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
    // Call details
    callingNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'A-number in E.164 format',
    },
    calledNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'B-number in E.164 format',
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: true,
    },
    // Timestamps
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    answerTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Duration
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total call duration in seconds',
    },
    billsec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Billable duration in seconds',
    },
    billableMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Billable duration in minutes (rounded up)',
    },
    // Call result
    hangupCause: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    isSuccessful: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Billing
    rateApplied: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0.0,
      comment: 'Rate per minute applied',
    },
    calculatedCost: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      comment: 'Final cost of the call',
    },
    isOverage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether call exceeded plan limits',
    },
    // Processing status
    status: {
      type: DataTypes.ENUM(...Object.values(CDR_STATUS)),
      defaultValue: CDR_STATUS.PENDING,
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processingError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // FreeSWITCH details
    switchId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'FreeSWITCH instance identifier',
    },
    accountCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Additional data
    rawData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Raw CDR data from FreeSWITCH',
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'cdrs',
    timestamps: true,
    updatedAt: true,
    indexes: [
      { fields: ['uuid'], unique: true },
      { fields: ['customerId'] },
      { fields: ['subscriptionId'] },
      { fields: ['accountId'] },
      { fields: ['callingNumber'] },
      { fields: ['calledNumber'] },
      { fields: ['startTime'] },
      { fields: ['status'] },
      { fields: ['processed'] },
      { fields: ['hangupCause'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
CDR.prototype.calculateBillableMinutes = function () {
  this.billableMinutes = Math.ceil(this.billsec / 60);
  return this.billableMinutes;
};

CDR.prototype.calculateCost = function (perMinuteRate) {
  this.calculateBillableMinutes();
  this.rateApplied = parseFloat(perMinuteRate);
  this.calculatedCost = this.billableMinutes * parseFloat(perMinuteRate);
  return this.calculatedCost;
};

CDR.prototype.markProcessed = async function () {
  this.processed = true;
  this.status = CDR_STATUS.PROCESSED;
  this.processedAt = new Date();
  await this.save();
};

CDR.prototype.markFailed = async function (error) {
  this.status = CDR_STATUS.FAILED;
  this.processingError = error.message || error;
  await this.save();
};

CDR.prototype.isAnswered = function () {
  return this.hangupCause === 'NORMAL_CLEARING' && this.billsec > 0;
};

module.exports = CDR;
