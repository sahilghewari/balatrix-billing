/**
 * DID (Phone Number) Model
 * Manage toll-free and regular phone number inventory
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { DID_STATUS } = require('../utils/constants');

const DID = sequelize.define(
  'DID',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Phone number in E.164 format',
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    // Number type
    numberType: {
      type: DataTypes.ENUM('toll_free', 'local', 'national', 'international'),
      defaultValue: 'toll_free',
    },
    isTollFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Status
    status: {
      type: DataTypes.ENUM(...Object.values(DID_STATUS)),
      defaultValue: DID_STATUS.AVAILABLE,
    },
    // Pricing
    monthlyCharge: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    oneTimeCharge: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 199.0,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    // Assignment details
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Geographic info
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: 'ISO country code',
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Routing
    destinationType: {
      type: DataTypes.ENUM('extension', 'external', 'ivr', 'queue', 'voicemail'),
      allowNull: true,
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Extension number, external number, or IVR menu',
    },
    // Call forwarding
    forwardingEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    forwardingNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Provider details
    providerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External provider reference',
    },
    providerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'dids',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    indexes: [
      { fields: ['phoneNumber'], unique: true },
      { fields: ['customerId'] },
      { fields: ['subscriptionId'] },
      { fields: ['status'] },
      { fields: ['numberType'] },
      { fields: ['isTollFree'] },
      { fields: ['country'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
DID.prototype.isAvailable = function () {
  return this.status === DID_STATUS.AVAILABLE;
};

DID.prototype.isAssigned = function () {
  return this.status === DID_STATUS.ASSIGNED;
};

DID.prototype.assignToCustomer = async function (customerId, subscriptionId) {
  this.customerId = customerId;
  this.subscriptionId = subscriptionId;
  this.status = DID_STATUS.ASSIGNED;
  this.assignedAt = new Date();
  this.releasedAt = null;
  await this.save();
};

DID.prototype.release = async function () {
  this.status = DID_STATUS.AVAILABLE;
  this.releasedAt = new Date();
  this.customerId = null;
  this.subscriptionId = null;
  this.destination = null;
  this.destinationType = null;
  await this.save();
};

DID.prototype.suspend = async function () {
  this.status = DID_STATUS.SUSPENDED;
  await this.save();
};

DID.prototype.setRouting = async function (destinationType, destination) {
  this.destinationType = destinationType;
  this.destination = destination;
  await this.save();
};

module.exports = DID;
