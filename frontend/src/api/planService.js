import api from './axios';

/**
 * Get all public subscription plans (no auth required)
 * @returns {Promise<Object>} Response with plans array
 */
export const getPublicPlans = async () => {
  const response = await api.get('/rate-plans/public');
  return response.data; // Return the actual data array
};

/**
 * Get a specific plan by ID
 * @param {string} planId - The plan ID
 * @returns {Promise<Object>} Response with plan data
 */
export const getPlanById = async (planId) => {
  const response = await api.get(`/rate-plans/${planId}`);
  return response.data.data; // Return the actual data
};

/**
 * Get a specific plan by code
 * @param {string} planCode - The plan code
 * @returns {Promise<Object>} Response with plan data
 */
export const getPlanByCode = async (planCode) => {
  const response = await api.get(`/rate-plans/code/${planCode}`);
  return response.data.data; // Return the actual data
};

/**
 * Calculate price for a subscription
 * @param {Object} priceData - Price calculation data
 * @param {string} priceData.planId - The plan ID
 * @param {string} priceData.billingCycle - Billing cycle (monthly/quarterly/annual)
 * @param {Array} priceData.addons - Array of addon objects with {code, quantity}
 * @returns {Promise<Object>} Response with calculated price breakdown
 */
export const calculatePrice = async (priceData) => {
  const response = await api.post('/rate-plans/calculate-price', priceData);
  return response.data.data; // Return the actual data
};

/**
 * Get all plans (admin only)
 * @returns {Promise<Object>} Response with plans array
 */
export const getAllPlans = async () => {
  const response = await api.get('/rate-plans');
  return response.data.data; // Return the actual data
};

/**
 * Create a new plan (admin only)
 * @param {Object} planData - Plan data
 * @returns {Promise<Object>} Response with created plan
 */
export const createPlan = async (planData) => {
  const response = await api.post('/rate-plans', planData);
  return response.data.data; // Return the actual data
};

/**
 * Update a plan (admin only)
 * @param {string} planId - The plan ID
 * @param {Object} planData - Updated plan data
 * @returns {Promise<Object>} Response with updated plan
 */
export const updatePlan = async (planId, planData) => {
  const response = await api.put(`/rate-plans/${planId}`, planData);
  return response.data.data; // Return the actual data
};

/**
 * Delete a plan (admin only)
 * @param {string} planId - The plan ID
 * @returns {Promise<Object>} Response with success message
 */
export const deletePlan = async (planId) => {
  const response = await api.delete(`/rate-plans/${planId}`);
  return response.data.data; // Return the actual data
};
