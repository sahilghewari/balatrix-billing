/**
 * Toll-Free Number Service
 * Handles API calls for toll-free number management
 */

import axios from './axios';

const tollFreeNumberService = {
  /**
   * Get available toll-free numbers
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Items per page (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @param {string} params.search - Search term for number patterns
   * @returns {Promise} API response with available numbers
   */
  getAvailableNumbers: async (params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      offset: params.offset || 0,
      ...(params.search && { search: params.search }),
    });

    const response = await axios.get(`/toll-free-numbers/available?${queryParams}`);
    return response;
  },

  /**
   * Assign toll-free number to customer
   * @param {string} customerId - Customer ID
   * @param {string} numberId - Toll-free number ID
   * @returns {Promise} API response with assignment details
   */
  assignNumberToCustomer: async (customerId, numberId) => {
    const response = await axios.post(`/customers/${customerId}/toll-free-numbers`, {
      numberId,
    });
    return response;
  },

  /**
   * Get customer's assigned toll-free numbers
   * @param {string} customerId - Customer ID
   * @returns {Promise} API response with customer's numbers
   */
  getCustomerNumbers: async (customerId) => {
    const response = await axios.get(`/customers/${customerId}/toll-free-numbers`);
    return response;
  },

  /**
   * Get current user's assigned toll-free numbers
   * @returns {Promise} API response with user's numbers
   */
  getMyNumbers: async () => {
    const response = await axios.get('/toll-free-numbers/my-numbers');
    return response;
  },

  /**
   * Unassign toll-free number from customer
   * @param {string} numberId - Toll-free number ID
   * @returns {Promise} API response
   */
  unassignNumber: async (numberId) => {
    const response = await axios.delete(`/toll-free-numbers/${numberId}/assignment`);
    return response;
  },
};

export default tollFreeNumberService;