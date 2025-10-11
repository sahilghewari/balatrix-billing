/**
 * Authentication Service
 * API calls for authentication operations
 */

import { api } from './api';
import { API_ENDPOINTS } from '@config/api';
import { STORAGE_KEYS } from '@utils/constants';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.auth.login, credentials);
    
    // Backend returns: { success, message, data: { user, accessToken, expiresIn } }
    const { user, accessToken, expiresIn } = response.data.data;

    // Store tokens and user data
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (response.data.data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.data.refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { user, accessToken, expiresIn };
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.auth.register, userData);
    // Backend returns: { success, message, data }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.auth.logout);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.auth.me);
    // Backend returns: { success, message, data }
    return response.data.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    // Use customers endpoint for profile updates
    const response = await api.put('/customers/me', profileData);
    
    // Backend returns: { success, message, data }
    const updatedData = response.data.data;
    
    // Update stored user data
    const storedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const updatedUser = { ...storedUser, ...updatedData };
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

    return updatedData;
  },

  /**
   * Change password
   */
  changePassword: async (passwordData) => {
    const response = await api.post(API_ENDPOINTS.auth.changePassword, passwordData);
    return response.data;
  },

  /**
   * Forgot password - send reset email
   */
  forgotPassword: async (email) => {
    const response = await api.post(API_ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (resetData) => {
    const response = await api.post(API_ENDPOINTS.auth.resetPassword, resetData);
    return response.data;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token) => {
    const response = await api.post(API_ENDPOINTS.auth.verifyEmail, { token });
    return response.data;
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email) => {
    const response = await api.post(API_ENDPOINTS.auth.resendVerification, { email });
    return response.data;
  },

  /**
   * Setup two-factor authentication
   */
  setup2FA: async () => {
    const response = await api.post(API_ENDPOINTS.auth.mfaSetup);
    return response.data;
  },

  /**
   * Verify two-factor authentication code
   */
  verify2FA: async (code) => {
    const response = await api.post(API_ENDPOINTS.auth.mfaVerify, { code });
    return response.data;
  },

  /**
   * Disable two-factor authentication
   */
  disable2FA: async (password) => {
    const response = await api.post(API_ENDPOINTS.auth.mfaDisable, { password });
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  /**
   * Get stored user data
   */
  getStoredUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Get stored auth token
   */
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

export default authService;
