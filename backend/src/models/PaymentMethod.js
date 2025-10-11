/**
 * Payment Method Model
 * Store customer payment methods (cards, UPI, etc.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentMethod = sequelize.define(
  'PaymentMethod',
  {
    methodId: {
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
    // Method type
    type: {
      type: DataTypes.ENUM('card', 'upi', 'net_banking', 'wallet'),
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Gateway details
    gateway: {
      type: DataTypes.ENUM('razorpay', 'stripe'),
      allowNull: false,
    },
    gatewayMethodId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment method ID from gateway',
    },
    // Card details (masked)
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Visa, Mastercard, Amex, etc.',
    },
    cardExpMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cardExpYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cardNetwork: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // UPI details
    upiId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Bank details (masked)
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    accountLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    // Billing address
    billingAddress: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Verification
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Usage tracking
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'payment_methods',
    timestamps: true,
    paranoid: false, // Disabled - migration does not have deletedAt column
    indexes: [
      { fields: ['customerId'] },
      { fields: ['gateway'] },
      { fields: ['gatewayMethodId'] },
      { fields: ['isDefault'] },
      { fields: ['isActive'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
PaymentMethod.prototype.markAsDefault = async function () {
  // Remove default flag from other methods
  await PaymentMethod.update(
    { isDefault: false },
    { where: { customerId: this.customerId, methodId: { [sequelize.Op.ne]: this.methodId } } }
  );

  this.isDefault = true;
  await this.save();
};

PaymentMethod.prototype.verify = async function () {
  this.isVerified = true;
  this.verifiedAt = new Date();
  await this.save();
};

PaymentMethod.prototype.recordUsage = async function () {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  await this.save();
};

PaymentMethod.prototype.getMaskedDetails = function () {
  const details = {
    type: this.type,
    isDefault: this.isDefault,
  };

  if (this.type === 'card') {
    details.card = {
      last4: this.cardLast4,
      brand: this.cardBrand,
      expMonth: this.cardExpMonth,
      expYear: this.cardExpYear,
    };
  } else if (this.type === 'upi') {
    details.upi = {
      id: this.upiId,
    };
  } else if (this.type === 'net_banking') {
    details.bank = {
      name: this.bankName,
      accountLast4: this.accountLast4,
    };
  }

  return details;
};

module.exports = PaymentMethod;
