/**
 * Extension Model
 * SIP extensions stored in main database (will sync to Kamailio)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Extension = sequelize.define(
  'Extension',
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
        model: 'Tenants', // Note: This references main db, but model is in kamailio db
        key: 'id',
      },
    },
    extension: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'sip.balatrix.com',
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: 'Extensions', // Explicitly set table name to match migration
    indexes: [
      {
        unique: true,
        fields: ['extension', 'domain'],
      },
      {
        fields: ['tenantId'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

// Instance methods
Extension.prototype.getSipUri = function () {
  return `sip:${this.extension}@${this.domain}`;
};

// Class methods
Extension.findActiveByTenant = function (tenantId) {
  return this.findAll({
    where: { tenantId, isActive: true },
  });
};

Extension.findByExtension = function (extension, domain = 'sip.balatrix.com') {
  return this.findOne({
    where: { extension, domain, isActive: true },
  });
};

module.exports = Extension;