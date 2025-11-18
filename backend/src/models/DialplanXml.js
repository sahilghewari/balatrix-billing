/**
 * DialplanXml Model
 * FreeSWITCH dialplan XML entries
 */

const { DataTypes } = require('sequelize');
const { freeswitchSequelize } = require('../config/database');

const DialplanXml = freeswitchSequelize.define(
  'dialplan_xmls',
  {
    dialplan_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    xml_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    xml_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'dialplan_xmls',
    timestamps: false, // Since we have last_updated
    indexes: [
      {
        fields: ['dialplan_id'],
      },
      {
        fields: ['xml_name'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

// Class methods
DialplanXml.findByNumber = function (dialplanId) {
  return this.findOne({
    where: { dialplan_id: dialplanId },
  });
};

DialplanXml.upsertByNumber = function (dialplanId, xmlName, xmlContent, description = null) {
  return this.upsert({
    dialplan_id: dialplanId,
    xml_name: xmlName,
    xml_content: xmlContent,
    description,
    last_updated: new Date(),
    is_active: true,
  });
};

module.exports = DialplanXml;