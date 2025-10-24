/**
 * Tenant Model
 * Multi-tenant system tenants
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define(
  'Tenant',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'Tenants',
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['domain'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

// Instance methods
Tenant.prototype.getFullName = function () {
  return this.name;
};

// Class methods
Tenant.findActive = function () {
  return this.findAll({
    where: { isActive: true },
  });
};

Tenant.findByDomain = function (domain) {
  return this.findOne({
    where: { domain, isActive: true },
  });
};

module.exports = Tenant;