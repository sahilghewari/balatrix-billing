/**
 * Model Index
 * Initialize all models and define associations
 */

const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Customer = require('./Customer');
const Account = require('./Account');
const AccountTransaction = require('./AccountTransaction');
const RatePlan = require('./RatePlan');
const Subscription = require('./Subscription');
const SubscriptionUsage = require('./SubscriptionUsage');
const CDR = require('./CDR');
const DID = require('./DID');
const Payment = require('./Payment');
const PaymentMethod = require('./PaymentMethod');
const Invoice = require('./Invoice');
const InvoiceLineItem = require('./InvoiceLineItem');
const RefreshToken = require('./RefreshToken');
const LoginAttempt = require('./LoginAttempt');
const SystemLog = require('./SystemLog');
const Tenant = require('./Tenant');
const Extension = require('./Extension');
const KamailioExtension = require('./KamailioExtension');
const TollFreeNumber = require('./TollFreeNumber');
const RoutingRule = require('./RoutingRule');
const DialplanXml = require('./DialplanXml');

// Define associations

// User <-> Customer (One-to-One)
User.hasOne(Customer, { foreignKey: 'userId', as: 'customer' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Customer <-> Tenant (Many-to-One)
Customer.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Tenant.hasMany(Customer, { foreignKey: 'tenantId', as: 'customers' });

// Customer <-> Account (One-to-Many)
Customer.hasMany(Account, { foreignKey: 'customerId', as: 'accounts' });
Account.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Account <-> AccountTransaction (One-to-Many)
Account.hasMany(AccountTransaction, { foreignKey: 'accountId', as: 'transactions' });
AccountTransaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Customer <-> Subscription (One-to-Many)
Customer.hasMany(Subscription, { foreignKey: 'customerId', as: 'subscriptions' });
Subscription.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Account <-> Subscription (One-to-Many)
Account.hasMany(Subscription, { foreignKey: 'accountId', as: 'subscriptions' });
Subscription.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// RatePlan <-> Subscription (One-to-Many)
RatePlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(RatePlan, { foreignKey: 'planId', as: 'plan' });

// Tenant <-> Subscription (One-to-Many)
Tenant.hasMany(Subscription, { foreignKey: 'tenantId', as: 'subscriptions' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Subscription <-> SubscriptionUsage (One-to-Many)
Subscription.hasMany(SubscriptionUsage, { foreignKey: 'subscriptionId', as: 'usageRecords' });
SubscriptionUsage.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Customer <-> CDR (One-to-Many)
Customer.hasMany(CDR, { foreignKey: 'customerId', as: 'cdrs' });
CDR.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Subscription <-> CDR (One-to-Many)
Subscription.hasMany(CDR, { foreignKey: 'subscriptionId', as: 'cdrs' });
CDR.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Account <-> CDR (One-to-Many)
Account.hasMany(CDR, { foreignKey: 'accountId', as: 'cdrs' });
CDR.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Customer <-> DID (One-to-Many)
Customer.hasMany(DID, { foreignKey: 'customerId', as: 'dids' });
DID.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Subscription <-> DID (One-to-Many)
Subscription.hasMany(DID, { foreignKey: 'subscriptionId', as: 'dids' });
DID.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Customer <-> Payment (One-to-Many)
Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'payments' });
Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Subscription <-> Payment (One-to-Many)
Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Account <-> Payment (One-to-Many)
Account.hasMany(Payment, { foreignKey: 'accountId', as: 'payments' });
Payment.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Customer <-> PaymentMethod (One-to-Many)
Customer.hasMany(PaymentMethod, { foreignKey: 'customerId', as: 'paymentMethods' });
PaymentMethod.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// PaymentMethod <-> Payment (One-to-Many)
PaymentMethod.hasMany(Payment, { foreignKey: 'paymentMethodId', as: 'payments' });
Payment.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethodRef' });

// Customer <-> Invoice (One-to-Many)
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Subscription <-> Invoice (One-to-Many)
Subscription.hasMany(Invoice, { foreignKey: 'subscriptionId', as: 'invoices' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Account <-> Invoice (One-to-Many)
Account.hasMany(Invoice, { foreignKey: 'accountId', as: 'invoices' });
Invoice.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Invoice <-> Payment (One-to-Many)
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// Invoice <-> InvoiceLineItem (One-to-Many)
Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoiceId', as: 'lineItems' });
InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User <-> RefreshToken (One-to-Many)
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> LoginAttempt (One-to-Many)
User.hasMany(LoginAttempt, { foreignKey: 'userId', as: 'loginAttempts' });
LoginAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> SystemLog (One-to-Many)
User.hasMany(SystemLog, { foreignKey: 'userId', as: 'systemLogs' });
SystemLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Customer <-> SystemLog (One-to-Many)
Customer.hasMany(SystemLog, { foreignKey: 'customerId', as: 'systemLogs' });
SystemLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Multi-tenant associations
// User <-> Tenant (One-to-Many - creator)
User.hasMany(Tenant, { foreignKey: 'createdBy', as: 'createdTenants' });
Tenant.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Tenant <-> TollFreeNumber (One-to-Many)
Tenant.hasMany(TollFreeNumber, { foreignKey: 'tenantId', as: 'tollFreeNumbers' });
TollFreeNumber.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Tenant <-> RoutingRule (One-to-Many)
Tenant.hasMany(RoutingRule, { foreignKey: 'tenantId', as: 'routingRules' });
RoutingRule.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Note: Extension model uses kamailioSequelize, so associations with main db models need careful handling
// Extension belongs to Tenant (cross-database reference)
Extension.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Export all models
module.exports = {
  sequelize,
  User,
  Customer,
  Account,
  AccountTransaction,
  RatePlan,
  Subscription,
  SubscriptionUsage,
  CDR,
  DID,
  Payment,
  PaymentMethod,
  Invoice,
  InvoiceLineItem,
  RefreshToken,
  LoginAttempt,
  SystemLog,
  Tenant,
  Extension,
  KamailioExtension,
  TollFreeNumber,
  RoutingRule,
  DialplanXml,
};
