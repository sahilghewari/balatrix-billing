/**
 * Routing API Service
 * Client wrapper for the routing endpoints
 */
import axios from './axios';

const routingService = {
  /**
   * Set a simple extension mapping for a toll-free number
   * @param {string} tollFreeNumberId
   * @param {string} extension
   */
  setMapping: async (tollFreeNumberId, extension) => {
    const response = await axios.post(`/routing/toll-free-numbers/${tollFreeNumberId}/route`, { extension });
    return response.data;
  },
};

export default routingService;
