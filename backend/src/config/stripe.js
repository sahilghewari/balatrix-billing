/**
 * Stripe Payment Gateway Configuration
 * Backup payment gateway for international payments
 */

const Stripe = require('stripe');
const logger = require('../utils/logger');

// Initialize Stripe only if credentials are provided
let stripe = null;

if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_xxxxxxxxxx') {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  logger.info('Stripe initialized');
} else {
  logger.warn('Stripe not configured - international payment features will be disabled');
}

/**
 * Create payment intent
 * @param {Object} paymentData - Payment data
 * @returns {Object} Payment intent
 */
const createPaymentIntent = async (paymentData) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'inr',
      payment_method_types: ['card'],
      metadata: paymentData.metadata || {},
      description: paymentData.description,
    });

    logger.info('Stripe payment intent created', { id: paymentIntent.id });
    return paymentIntent;
  } catch (error) {
    logger.error('Stripe create payment intent error:', error);
    throw error;
  }
};

/**
 * Confirm payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethod - Payment method ID
 * @returns {Object} Confirmed payment intent
 */
const confirmPaymentIntent = async (paymentIntentId, paymentMethod) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod,
    });

    logger.info('Stripe payment intent confirmed', { id: paymentIntent.id });
    return paymentIntent;
  } catch (error) {
    logger.error('Stripe confirm payment intent error:', error);
    throw error;
  }
};

/**
 * Create customer
 * @param {Object} customerData - Customer data
 * @returns {Object} Stripe customer
 */
const createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: customerData.metadata || {},
    });

    logger.info('Stripe customer created', { id: customer.id });
    return customer;
  } catch (error) {
    logger.error('Stripe create customer error:', error);
    throw error;
  }
};

/**
 * Create subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Object} Stripe subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: subscriptionData.customerId,
      items: subscriptionData.items,
      metadata: subscriptionData.metadata || {},
      trial_period_days: subscriptionData.trialDays,
    });

    logger.info('Stripe subscription created', { id: subscription.id });
    return subscription;
  } catch (error) {
    logger.error('Stripe create subscription error:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Object} Cancelled subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    logger.info('Stripe subscription cancelled', { id: subscriptionId });
    return subscription;
  } catch (error) {
    logger.error('Stripe cancel subscription error:', error);
    throw error;
  }
};

/**
 * Create refund
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund (optional)
 * @returns {Object} Refund details
 */
const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const options = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      options.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(options);
    logger.info('Stripe refund created', { id: refund.id });

    return refund;
  } catch (error) {
    logger.error('Stripe create refund error:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 * @param {string} body - Webhook body
 * @param {string} signature - Webhook signature
 * @returns {Object} Verified event
 */
const verifyWebhookSignature = (body, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    return event;
  } catch (error) {
    logger.error('Stripe webhook verification error:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  confirmPaymentIntent,
  createCustomer,
  createSubscription,
  cancelSubscription,
  createRefund,
  verifyWebhookSignature,
};
