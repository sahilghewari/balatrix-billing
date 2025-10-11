/**
 * Customer Model
 * Customer accounts with company information
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessType: {
      type: DataTypes.ENUM('individual', 'small_business', 'enterprise'),
      defaultValue: 'individual',
      allowNull: false,
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
    },
    pan: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    billingCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    billingState: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    billingCountry: {
      type: DataTypes.STRING(100),
      defaultValue: 'India',
      allowNull: false,
    },
    billingPincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'pending', 'cancelled'),
      defaultValue: 'active',
      allowNull: false,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'submitted', 'verified', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    kycDocuments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    taxExempt: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'customers',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    indexes: [
      { fields: ['userId'] },
      { fields: ['companyName'] },
      { fields: ['status'] },
      { fields: ['gstin'] },
      // { fields: ['razorpayCustomerId'] }, // Commented out - Razorpay not configured
      // { fields: ['stripeCustomerId'] }, // Commented out - Stripe not configured
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
Customer.prototype.isActive = function () {
  return this.status === 'active';
};

Customer.prototype.isSuspended = function () {
  return this.status === 'suspended';
};

Customer.prototype.suspend = async function (reason) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspensionReason = reason;
  await this.save();
};

Customer.prototype.activate = async function () {
  this.status = 'active';
  this.suspendedAt = null;
  this.suspensionReason = null;
  if (!this.onboardedAt) {
    this.onboardedAt = new Date();
  }
  await this.save();
};

Customer.prototype.getAvailableCredit = function () {
  return parseFloat(this.creditLimit) - parseFloat(this.creditUsed);
};

module.exports = Customer;
