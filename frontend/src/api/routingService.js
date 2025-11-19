/**
 * Routing API Service
 * Client wrapper for the routing endpoints
 */
import axios from './axios';

const routingService = {
  /**
   * Get available dialplan templates
   */
  getTemplates: async () => {
    const response = await axios.get('/routing/templates');
    return response.data;
  },

  /**
   * Set a simple extension mapping for a toll-free number
   * @param {string} tollFreeNumberId
   * @param {string} extension
   * @param {string} template - Template ID to use
   */
  setMapping: async (tollFreeNumberId, extension, template = 'incoming_generic') => {
    const response = await axios.post(`/routing/toll-free-numbers/${tollFreeNumberId}/route`, { extension, template });
    return response.data;
  },
};

export default routingService;
