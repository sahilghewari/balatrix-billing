/**
 * Kamailio Subscriber Model
 * Extension model for Kamailio subscriber table synchronization
 */

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const { kamailioSequelize } = require('../config/database');

const KamailioExtension = kamailioSequelize.define(
  'subscriber',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    ha1: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    ha1b: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    tableName: 'subscriber',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['username', 'domain'],
      },
    ],
  }
);

// Instance method to calculate HA1 hash
KamailioExtension.prototype.calculateHA1 = function() {
  const ha1 = crypto.createHash('md5')
    .update(`${this.username}:${this.domain}:${this.password}`)
    .digest('hex');
  return ha1;
};

// Instance method to calculate HA1B hash (with realm)
KamailioExtension.prototype.calculateHA1B = function(realm = 'sip.balatrix.com') {
  const ha1b = crypto.createHash('md5')
    .update(`${this.username}@${this.domain}:${realm}:${this.password}`)
    .digest('hex');
  return ha1b;
};

module.exports = KamailioExtension;