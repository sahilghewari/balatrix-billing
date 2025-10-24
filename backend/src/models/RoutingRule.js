/**
 * RoutingRule Model
 * Call routing rules for toll-free numbers
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoutingRule = sequelize.define(
  'RoutingRule',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tollFreeNumberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'TollFreeNumbers',
        key: 'id',
      },
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
    },
    ruleType: {
      type: DataTypes.ENUM('extension', 'ivr', 'queue', 'voicemail'),
      allowNull: false,
      defaultValue: 'extension',
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Conditions for when this rule applies (time, caller ID, etc.)',
    },
    actions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Actions to take (extension ID, IVR script, etc.)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        fields: ['tollFreeNumberId'],
      },
      {
        fields: ['tenantId'],
      },
      {
        fields: ['ruleType'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

// Instance methods
RoutingRule.prototype.getTargetExtension = function () {
  if (this.ruleType === 'extension' && this.actions.extensionId) {
    return this.actions.extensionId;
  }
  return null;
};

RoutingRule.prototype.getIvrScript = function () {
  if (this.ruleType === 'ivr' && this.actions.ivrScript) {
    return this.actions.ivrScript;
  }
  return null;
};

// Class methods
RoutingRule.findActiveByNumber = function (tollFreeNumberId) {
  return this.findAll({
    where: { tollFreeNumberId, isActive: true },
    order: [['priority', 'ASC']],
  });
};

RoutingRule.findByTenant = function (tenantId) {
  return this.findAll({
    where: { tenantId, isActive: true },
    include: [
      {
        model: require('./TollFreeNumber'),
        as: 'tollFreeNumber',
      },
    ],
  });
};

module.exports = RoutingRule;