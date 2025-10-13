/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import axiosInstance from './axios';
import { API_ENDPOINTS, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../constants';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Response with user data and tokens
   */
  async register(userData) {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    
    // Backend returns accessToken and user directly in data
    if (response.data?.accessToken) {
      const tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
      this.setAuthData(tokens, response.data.user);
    }
    
    return response;
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with user data and tokens
   */
  async login(email, password) {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    
    // Backend returns accessToken and user directly in data
    if (response.data?.accessToken) {
      const tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken, // May be undefined if using httpOnly cookies
      };
      this.setAuthData(tokens, response.data.user);
    }
    
    return response;
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Response
   */
  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Response
   */
  async forgotPassword(email) {
    return await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Response
   */
  async resetPassword(token, password) {
    return await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password,
    });
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Response
   */
  async verifyEmail(token) {
    return await axiosInstance.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`);
  }

  /**
   * Change password (authenticated user)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response
   */
  async changePassword(currentPassword, newPassword) {
    return await axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    
    if (response.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    }
    
    return response;
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });
    
    // Backend returns accessToken directly in data
    if (response.data?.accessToken) {
      const tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
      this.setAuthData(tokens);
    }
    
    return response;
  }

  /**
   * Set authentication data in localStorage
   * @param {Object} tokens - Access and refresh tokens
   * @param {Object} user - User data (optional)
   */
  setAuthData(tokens, user = null) {
    if (tokens.accessToken) {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored user data
   * @returns {Object|null} User data
   */
  getUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get stored access token
   * @returns {string|null} Access token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
}

export default new AuthService();
