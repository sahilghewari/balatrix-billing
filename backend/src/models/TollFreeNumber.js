/**
 * TollFreeNumber Model
 * Simplified toll-free number management for tenants
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
      allowNull: true, // null = available, assigned = tenant owns it
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
    setupCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    perMinuteCost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0.0000,
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: 'TollFreeNumbers', // Match the migration table name
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
    ],
  }
);

// Instance methods
TollFreeNumber.prototype.assignToTenant = function (tenantId) {
  this.tenantId = tenantId;
  this.status = 'inactive'; // Set status to inactive (assigned)
  this.assignedAt = new Date();
  return this.save();
};

TollFreeNumber.prototype.unassign = function () {
  this.tenantId = null;
  this.status = 'active';
  this.assignedAt = null;
  return this.save();
};

TollFreeNumber.prototype.suspend = function () {
  this.status = 'suspended';
  return this.save();
};

// Class methods
TollFreeNumber.getAvailable = function (limit = 20, offset = 0) {
  return this.findAll({
    where: { status: 'active' },
    limit,
    offset,
    order: [['number', 'ASC']],
  });
};

TollFreeNumber.getByTenant = function (tenantId) {
  return this.findAll({
    where: { tenantId, status: 'inactive' },
    order: [['number', 'ASC']],
  });
};

TollFreeNumber.findByNumber = function (number) {
  return this.findOne({
    where: { number },
  });
};

module.exports = TollFreeNumber;
