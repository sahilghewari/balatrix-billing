/**
 * Invoice Model
 * Generated invoices for billing periods
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { INVOICE_STATUS } = require('../utils/constants');

const Invoice = sequelize.define(
  'Invoice',
  {
    id: {
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    // Invoice details
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Billing period
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Amounts
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
    },
    // Tax breakdown (Indian GST)
    taxableAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    cgst: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      comment: 'Central GST (9%)',
    },
    sgst: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      comment: 'State GST (9%)',
    },
    igst: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      comment: 'Integrated GST (18%)',
    },
    totalTax: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    // Payment tracking
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    amountDue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
    },
    // Status
    status: {
      type: DataTypes.ENUM(...Object.values(INVOICE_STATUS)),
      defaultValue: INVOICE_STATUS.DRAFT,
    },
    // Dates
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Currency
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    // Customer details snapshot (for historical accuracy)
    customerDetails: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Customer and billing address at time of invoice',
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // PDF
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    pdfGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'invoices',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    indexes: [
      { fields: ['customerId'] },
      { fields: ['subscriptionId'] },
      { fields: ['invoiceNumber'], unique: true },
      { fields: ['status'] },
      { fields: ['invoiceDate'] },
      { fields: ['dueDate'] },
      { fields: ['periodStart', 'periodEnd'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
Invoice.prototype.calculateTotals = function (isInterstate = false) {
  // Calculate taxable amount after discount
  this.taxableAmount = parseFloat(this.subtotal) - parseFloat(this.discountAmount);

  // Apply discount percentage if set
  if (this.discountPercent > 0) {
    const discountFromPercent = (parseFloat(this.taxableAmount) * parseFloat(this.discountPercent)) / 100;
    this.taxableAmount -= discountFromPercent;
    this.discountAmount = parseFloat(this.discountAmount) + discountFromPercent;
  }

  // Calculate GST
  if (isInterstate) {
    // Inter-state: IGST 18%
    this.igst = parseFloat(this.taxableAmount) * 0.18;
    this.cgst = 0;
    this.sgst = 0;
  } else {
    // Intra-state: CGST 9% + SGST 9%
    this.cgst = parseFloat(this.taxableAmount) * 0.09;
    this.sgst = parseFloat(this.taxableAmount) * 0.09;
    this.igst = 0;
  }

  this.totalTax = parseFloat(this.cgst) + parseFloat(this.sgst) + parseFloat(this.igst);
  this.totalAmount = parseFloat(this.taxableAmount) + parseFloat(this.totalTax);
  this.amountDue = parseFloat(this.totalAmount) - parseFloat(this.amountPaid);

  return this;
};

Invoice.prototype.markAsSent = async function () {
  this.status = INVOICE_STATUS.SENT;
  this.sentAt = new Date();
  await this.save();
};

Invoice.prototype.markAsPaid = async function (paymentAmount = null) {
  const paid = paymentAmount || this.totalAmount;
  this.amountPaid = parseFloat(this.amountPaid) + parseFloat(paid);
  this.amountDue = parseFloat(this.totalAmount) - parseFloat(this.amountPaid);

  if (this.amountDue <= 0) {
    this.status = INVOICE_STATUS.PAID;
    this.paidAt = new Date();
  } else {
    this.status = INVOICE_STATUS.PARTIALLY_PAID;
  }

  await this.save();
};

Invoice.prototype.markAsVoid = async function () {
  this.status = INVOICE_STATUS.VOID;
  this.voidedAt = new Date();
  await this.save();
};

Invoice.prototype.isOverdue = function () {
  return this.status !== INVOICE_STATUS.PAID && new Date() > this.dueDate;
};

Invoice.prototype.isPaid = function () {
  return this.status === INVOICE_STATUS.PAID;
};

Invoice.prototype.isDraft = function () {
  return this.status === INVOICE_STATUS.DRAFT;
};

module.exports = Invoice;
