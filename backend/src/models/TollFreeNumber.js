/**
 * TollFreeNumber Model
 * Toll-free numbers assigned to tenants
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TollFreeNumber = sequelize.define(
  'TollFreeNumber',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
    },
    number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'balatrix',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false,
    },
    monthlyCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    perMinuteCost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0.0000,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['number'],
      },
      {
        fields: ['tenantId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['provider'],
      },
    ],
  }
);

// Instance methods
TollFreeNumber.prototype.activate = function () {
  this.status = 'active';
  this.activatedAt = new Date();
  return this.save();
};

TollFreeNumber.prototype.suspend = function () {
  this.status = 'suspended';
  return this.save();
};

TollFreeNumber.prototype.getFormattedNumber = function () {
  // Format as (XXX) XXX-XXXX for US numbers
  const cleaned = this.number.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return this.number;
};

// Class methods
TollFreeNumber.findActiveByTenant = function (tenantId) {
  return this.findAll({
    where: { tenantId, status: 'active' },
  });
};

TollFreeNumber.findByNumber = function (number) {
  return this.findOne({
    where: { number },
  });
};

module.exports = TollFreeNumber;