/**
 * Test Fixtures
 * Create test data for tests
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  User,
  Customer,
  Account,
  RatePlan,
  Subscription,
  CDR,
  Payment,
  Invoice,
} = require('../../src/models');

/**
 * Create test user
 */
const createTestUser = async (data = {}) => {
  const hashedPassword = await bcrypt.hash(data.password || 'Test@123', 12);
  
  return await User.create({
    username: data.username || `testuser_${uuidv4().substring(0, 8)}`,
    email: data.email || `test_${uuidv4().substring(0, 8)}@example.com`,
    password: hashedPassword,
    firstName: data.firstName || 'Test',
    lastName: data.lastName || 'User',
    phoneNumber: data.phoneNumber || '+919876543210',
    role: data.role || 'customer',
    isActive: data.isActive !== undefined ? data.isActive : true,
    isEmailVerified: data.isEmailVerified !== undefined ? data.isEmailVerified : true,
    isPhoneVerified: data.isPhoneVerified !== undefined ? data.isPhoneVerified : false,
  });
};

/**
 * Create test customer
 */
const createTestCustomer = async (userId, data = {}) => {
  return await Customer.create({
    userId,
    companyName: data.companyName || null,
    businessType: data.businessType || 'individual',
    gstin: data.gstin || null,
    pan: data.pan || null,
    billingAddress: data.billingAddress || '123 Test Street',
    billingCity: data.billingCity || 'Bangalore',
    billingState: data.billingState || 'Karnataka',
    billingCountry: data.billingCountry || 'India',
    billingPincode: data.billingPincode || '560001',
    status: data.status || 'active',
    creditLimit: data.creditLimit || 0,
    kycStatus: data.kycStatus || 'verified',
  });
};

/**
 * Create test rate plan
 */
const createTestRatePlan = async (data = {}) => {
  return await RatePlan.create({
    name: data.name || `Test Plan ${uuidv4().substring(0, 8)}`,
    description: data.description || 'Test rate plan',
    planType: data.planType || 'prepaid',
    monthlyPrice: data.monthlyPrice || 349,
    annualPrice: data.annualPrice || 4008,
    setupFee: data.setupFee || 0,
    includedMinutes: data.includedMinutes || 500,
    includedDIDs: data.includedDIDs || 1,
    maxConcurrentCalls: data.maxConcurrentCalls || 2,
    overageRatePerMinute: data.overageRatePerMinute || 0.5,
    didMonthlyRate: data.didMonthlyRate || 99,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
};

/**
 * Create test account
 */
const createTestAccount = async (customerId, data = {}) => {
  return await Account.create({
    customerId,
    accountNumber: data.accountNumber || `ACC-${uuidv4().substring(0, 8)}`,
    accountType: data.accountType || 'prepaid',
    balance: data.balance || 1000,
    creditLimit: data.creditLimit || 0,
    status: data.status || 'active',
    currency: data.currency || 'INR',
    billingCycle: data.billingCycle || 'monthly',
    billingDay: data.billingDay || 1,
  });
};

/**
 * Create test subscription
 */
const createTestSubscription = async (customerId, accountId, ratePlanId, data = {}) => {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return await Subscription.create({
    customerId,
    accountId,
    ratePlanId,
    subscriptionNumber: data.subscriptionNumber || `SUB-${uuidv4().substring(0, 8)}`,
    status: data.status || 'active',
    billingCycle: data.billingCycle || 'monthly',
    startDate: data.startDate || now,
    nextBillingDate: data.nextBillingDate || nextMonth,
    currentPeriodStart: data.currentPeriodStart || now,
    currentPeriodEnd: data.currentPeriodEnd || nextMonth,
    autoRenew: data.autoRenew !== undefined ? data.autoRenew : true,
  });
};

/**
 * Create test CDR
 */
const createTestCDR = async (subscriptionId, accountId, data = {}) => {
  return await CDR.create({
    uuid: data.uuid || uuidv4(),
    subscriptionId,
    accountId,
    callerId: data.callerId || '+919876543210',
    destination: data.destination || '+911234567890',
    startTime: data.startTime || new Date(),
    endTime: data.endTime || new Date(),
    duration: data.duration || 120,
    billableSeconds: data.billableSeconds || 120,
    callDirection: data.callDirection || 'outbound',
    callType: data.callType || 'local',
    callStatus: data.callStatus || 'answered',
    cost: data.cost || 0.5,
    processingStatus: data.processingStatus || 'processed',
  });
};

/**
 * Create test payment
 */
const createTestPayment = async (customerId, data = {}) => {
  return await Payment.create({
    customerId,
    accountId: data.accountId || null,
    subscriptionId: data.subscriptionId || null,
    invoiceId: data.invoiceId || null,
    paymentNumber: data.paymentNumber || `PAY-${uuidv4().substring(0, 8)}`,
    amount: data.amount || 349,
    currency: data.currency || 'INR',
    paymentMethod: data.paymentMethod || 'credit_card',
    status: data.status || 'completed',
    gateway: data.gateway || 'razorpay',
    gatewayPaymentId: data.gatewayPaymentId || `pay_${uuidv4().substring(0, 8)}`,
    paidAt: data.paidAt || new Date(),
  });
};

/**
 * Create test invoice
 */
const createTestInvoice = async (customerId, data = {}) => {
  return await Invoice.create({
    customerId,
    accountId: data.accountId || null,
    subscriptionId: data.subscriptionId || null,
    invoiceNumber: data.invoiceNumber || `INV-${uuidv4().substring(0, 8)}`,
    invoiceType: data.invoiceType || 'subscription',
    status: data.status || 'finalized',
    subtotal: data.subtotal || 349,
    taxAmount: data.taxAmount || 62.82,
    totalAmount: data.totalAmount || 411.82,
    paidAmount: data.paidAmount || 0,
    balanceAmount: data.balanceAmount || 411.82,
    currency: data.currency || 'INR',
    issueDate: data.issueDate || new Date(),
    dueDate: data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });
};

/**
 * Create full test customer with related entities
 */
const createFullTestCustomer = async (data = {}) => {
  // Create user
  const user = await createTestUser(data.user);
  
  // Create customer
  const customer = await createTestCustomer(user.id, data.customer);
  
  // Create rate plan
  const ratePlan = await createTestRatePlan(data.ratePlan);
  
  // Create account
  const account = await createTestAccount(customer.id, data.account);
  
  // Create subscription
  const subscription = await createTestSubscription(
    customer.id,
    account.id,
    ratePlan.id,
    data.subscription
  );
  
  return {
    user,
    customer,
    ratePlan,
    account,
    subscription,
  };
};

module.exports = {
  createTestUser,
  createTestCustomer,
  createTestRatePlan,
  createTestAccount,
  createTestSubscription,
  createTestCDR,
  createTestPayment,
  createTestInvoice,
  createFullTestCustomer,
};
