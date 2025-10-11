/**
 * Billing Service
 * API calls for billing and payment operations
 */

import { api } from './api';
import { API_ENDPOINTS } from '@config/api';

export const billingService = {
  // ===== INVOICES =====
  
  /**
   * Get all invoices
   */
  getInvoices: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.invoices.list, { params });
    return response.data.data;
  },

  /**
   * Get single invoice by ID
   */
  getInvoice: async (invoiceId) => {
    const response = await api.get(API_ENDPOINTS.invoices.getById(invoiceId));
    return response.data.data;
  },

  /**
   * Get overdue invoices
   */
  getOverdueInvoices: async () => {
    const response = await api.get(API_ENDPOINTS.invoices.overdue);
    return response.data.data;
  },

  /**
   * Get invoice statistics
   */
  getInvoiceStatistics: async () => {
    const response = await api.get(API_ENDPOINTS.invoices.statistics);
    return response.data.data;
  },

  /**
   * Generate subscription invoice
   */
  generateSubscriptionInvoice: async (subscriptionId) => {
    const response = await api.post(API_ENDPOINTS.invoices.generateSubscription(subscriptionId));
    return response.data.data;
  },

  /**
   * Mark invoice as paid
   */
  markInvoicePaid: async (invoiceId, paymentData) => {
    const response = await api.post(API_ENDPOINTS.invoices.markPaid(invoiceId), paymentData);
    return response.data.data;
  },

  /**
   * Void invoice
   */
  voidInvoice: async (invoiceId) => {
    const response = await api.post(API_ENDPOINTS.invoices.void(invoiceId));
    return response.data.data;
  },

  // ===== PAYMENTS =====
  
  /**
   * Get payment history
   */
  getPayments: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.payments.list, { params });
    return response.data.data;
  },

  /**
   * Get single payment
   */
  getPayment: async (paymentId) => {
    const response = await api.get(API_ENDPOINTS.payments.getById(paymentId));
    return response.data.data;
  },

  /**
   * Get payment statistics
   */
  getPaymentStatistics: async () => {
    const response = await api.get(API_ENDPOINTS.payments.statistics);
    return response.data.data;
  },

  /**
   * Create payment
   */
  createPayment: async (paymentData) => {
    const response = await api.post(API_ENDPOINTS.payments.create, paymentData);
    return response.data.data;
  },

  /**
   * Verify payment
   */
  verifyPayment: async (paymentId, verificationData) => {
    const response = await api.post(API_ENDPOINTS.payments.verify(paymentId), verificationData);
    return response.data.data;
  },

  /**
   * Retry failed payment
   */
  retryPayment: async (paymentId) => {
    const response = await api.post(API_ENDPOINTS.payments.retry(paymentId));
    return response.data.data;
  },

  /**
   * Refund payment
   */
  refundPayment: async (paymentId, refundData) => {
    const response = await api.post(API_ENDPOINTS.payments.refund(paymentId), refundData);
    return response.data.data;
  },
};

export default billingService;
