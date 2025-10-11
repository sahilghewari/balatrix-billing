/**
 * Invoice Line Item Model
 * Detailed breakdown of invoice charges
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceLineItem = sequelize.define(
  'InvoiceLineItem',
  {
    lineItemId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Item details
    itemType: {
      type: DataTypes.ENUM(
        'subscription',
        'usage',
        'overage',
        'addon',
        'setup_fee',
        'toll_free_number',
        'extension',
        'adjustment',
        'discount',
        'credit'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Quantity and pricing
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1.0,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    // Reference to source
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'subscription, cdr, usage_record, etc.',
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Period
    periodStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Tax
    isTaxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Display order
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'invoice_line_items',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['invoiceId'] },
      { fields: ['itemType'] },
      { fields: ['referenceType', 'referenceId'] },
      { fields: ['displayOrder'] },
    ],
  }
);

// Instance methods
InvoiceLineItem.prototype.calculateAmount = function () {
  this.amount = parseFloat(this.quantity) * parseFloat(this.unitPrice);
  return this.amount;
};

module.exports = InvoiceLineItem;
