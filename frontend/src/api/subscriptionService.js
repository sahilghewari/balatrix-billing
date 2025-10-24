/**
 * Subscription Service
 * API calls for subscription management
 */

import api from './axios';

/**
 * Get current user's active subscription
 * @returns {Promise<Object>} Response with subscription data
 */
export const getMySubscription = async () => {
  const response = await api.get('/subscriptions/my-subscription');
  return response.data.data; // Return the actual data
};

/**
 * Create subscription with payment
 * @param {Object} subscriptionData - Subscription creation data
 * @param {string} subscriptionData.planId - The plan ID
 * @param {string} subscriptionData.billingCycle - Billing cycle (monthly/quarterly/annual)
 * @param {Array} subscriptionData.addons - Array of addon objects
 * @param {Object} subscriptionData.customerDetails - Customer information
 * @returns {Promise<Object>} Response with Razorpay order details
 */
export const createSubscriptionWithPayment = async (subscriptionData) => {
  const response = await api.post('/subscriptions/create-with-payment', subscriptionData);
  return response.data.data; // Return the actual data
};

/**
 * Verify payment and activate subscription
 * @param {Object} paymentData - Payment verification data
 * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentData.razorpay_order_id - Razorpay order ID
 * @param {string} paymentData.razorpay_signature - Razorpay signature
 * @returns {Promise<Object>} Response with activated subscription
 */
export const verifyPayment = async (paymentData) => {
  const response = await api.post('/subscriptions/verify-payment', paymentData);
  return response.data.data; // Return the actual data
};

/**
 * Get subscription by ID
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise<Object>} Response with subscription data
 */
export const getSubscriptionById = async (subscriptionId) => {
  const response = await api.get(`/subscriptions/${subscriptionId}`);
  return response.data.data; // Return the actual data
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise<Object>} Response with cancellation confirmation
 */
export const cancelSubscription = async (subscriptionId) => {
  const response = await api.post(`/subscriptions/${subscriptionId}/cancel`);
  return response.data.data; // Return the actual data
};

/**
 * Change subscription plan
 * @param {string} subscriptionId - The subscription ID
 * @param {Object} newPlanData - New plan data
 * @param {string} newPlanData.newPlanId - The new plan ID
 * @param {string} newPlanData.billingCycle - New billing cycle
 * @returns {Promise<Object>} Response with updated subscription
 */
export const changeSubscriptionPlan = async (subscriptionId, newPlanData) => {
  const response = await api.post(`/subscriptions/${subscriptionId}/change-plan`, newPlanData);
  return response.data.data; // Return the actual data
};

/**
 * Get subscription usage
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise<Object>} Response with usage data
 */
export const getSubscriptionUsage = async (subscriptionId) => {
  const response = await api.get(`/subscriptions/${subscriptionId}/usage`);
  return response.data.data; // Return the actual data
};
