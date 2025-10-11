/**
 * Razorpay Payment Gateway Configuration
 * Primary payment gateway for Indian market
 */

const Razorpay = require('razorpay');
const logger = require('../utils/logger');

// Initialize Razorpay instance only if credentials are provided
let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_xxxxxxxxxx') {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  logger.info('Razorpay initialized');
} else {
  logger.warn('Razorpay not configured - payment features will be disabled');
}

/**
 * Create Razorpay order
 * @param {Object} orderData - Order data
 * @returns {Object} Razorpay order
 */
const createOrder = async (orderData) => {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured');
  }
  
  try {
    const options = {
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: orderData.currency || 'INR',
      receipt: orderData.receipt,
      notes: orderData.notes || {},
    };

    const order = await razorpayInstance.orders.create(options);
    logger.info('Razorpay order created', { orderId: order.id });

    return order;
  } catch (error) {
    logger.error('Razorpay create order error:', error);
    throw error;
  }
};

/**
 * Verify payment signature
 * @param {Object} paymentData - Payment verification data
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (paymentData) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    logger.error('Razorpay signature verification error:', error);
    return false;
  }
};

/**
 * Verify webhook signature
 * @param {string} body - Webhook body
 * @param {string} signature - Webhook signature
 * @returns {boolean} True if valid
 */
const verifyWebhookSignature = (body, signature) => {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    logger.error('Razorpay webhook signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Object} Payment details
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error('Razorpay fetch payment error:', error);
    throw error;
  }
};

/**
 * Capture payment
 * @param {string} paymentId - Payment ID
 * @param {number} amount - Amount to capture
 * @param {string} currency - Currency code
 * @returns {Object} Captured payment
 */
const capturePayment = async (paymentId, amount, currency = 'INR') => {
  try {
    const payment = await razorpayInstance.payments.capture(
      paymentId,
      Math.round(amount * 100), // Convert to paise
      currency
    );

    logger.info('Payment captured', { paymentId });
    return payment;
  } catch (error) {
    logger.error('Razorpay capture payment error:', error);
    throw error;
  }
};

/**
 * Refund payment
 * @param {string} paymentId - Payment ID
 * @param {number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {Object} Refund details
 */
const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpayInstance.payments.refund(paymentId, options);
    logger.info('Payment refunded', { paymentId, refundId: refund.id });

    return refund;
  } catch (error) {
    logger.error('Razorpay refund payment error:', error);
    throw error;
  }
};

/**
 * Create subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Object} Razorpay subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const options = {
      plan_id: subscriptionData.planId,
      customer_notify: subscriptionData.customerNotify !== false ? 1 : 0,
      total_count: subscriptionData.totalCount,
      quantity: subscriptionData.quantity || 1,
      notes: subscriptionData.notes || {},
    };

    if (subscriptionData.startAt) {
      options.start_at = Math.floor(new Date(subscriptionData.startAt).getTime() / 1000);
    }

    if (subscriptionData.addons) {
      options.addons = subscriptionData.addons;
    }

    const subscription = await razorpayInstance.subscriptions.create(options);
    logger.info('Razorpay subscription created', { subscriptionId: subscription.id });

    return subscription;
  } catch (error) {
    logger.error('Razorpay create subscription error:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {boolean} cancelAtCycleEnd - Cancel at end of current cycle
 * @returns {Object} Cancelled subscription
 */
const cancelSubscription = async (subscriptionId, cancelAtCycleEnd = false) => {
  try {
    const subscription = await razorpayInstance.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    });

    logger.info('Razorpay subscription cancelled', { subscriptionId });
    return subscription;
  } catch (error) {
    logger.error('Razorpay cancel subscription error:', error);
    throw error;
  }
};

/**
 * Create customer
 * @param {Object} customerData - Customer data
 * @returns {Object} Razorpay customer
 */
const createCustomer = async (customerData) => {
  try {
    const options = {
      name: customerData.name,
      email: customerData.email,
      contact: customerData.contact,
      notes: customerData.notes || {},
    };

    const customer = await razorpayInstance.customers.create(options);
    logger.info('Razorpay customer created', { customerId: customer.id });

    return customer;
  } catch (error) {
    logger.error('Razorpay create customer error:', error);
    throw error;
  }
};

/**
 * Fetch customer details
 * @param {string} customerId - Razorpay customer ID
 * @returns {Object} Customer details
 */
const fetchCustomer = async (customerId) => {
  try {
    const customer = await razorpayInstance.customers.fetch(customerId);
    return customer;
  } catch (error) {
    logger.error('Razorpay fetch customer error:', error);
    throw error;
  }
};

module.exports = {
  razorpayInstance,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPayment,
  capturePayment,
  refundPayment,
  createSubscription,
  cancelSubscription,
  createCustomer,
  fetchCustomer,
};
