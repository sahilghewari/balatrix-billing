/**
 * Call Monitoring API Service
 * Frontend API calls for call monitoring
 */

import axiosInstance from './axios';

// Base URL for call monitoring endpoints
const CALL_MONITORING_BASE = '/call-monitoring';

/**
 * Get call monitoring health status
 * @returns {Promise<Object>} Health status response
 */
export const getHealth = async () => {
  const response = await axiosInstance.get(`${CALL_MONITORING_BASE}/health`);
  return response;
};

/**
 * Get call monitoring metrics
 * @returns {Promise<Object>} Metrics response
 */
export const getMetrics = async () => {
  const response = await axiosInstance.get(`${CALL_MONITORING_BASE}/metrics`);
  return response;
};

/**
 * Get active calls (filtered by customer)
 * @param {Object} filters - Optional filters
 * @param {string} filters.user - Filter by user
 * @param {string} filters.number - Filter by number
 * @returns {Promise<Object>} Active calls response
 */
export const getCalls = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.user) params.append('user', filters.user);
  if (filters.number) params.append('number', filters.number);

  const queryString = params.toString();
  const url = `${CALL_MONITORING_BASE}/calls${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get(url);
  return response;
};

export default {
  getHealth,
  getMetrics,
  getCalls,
};