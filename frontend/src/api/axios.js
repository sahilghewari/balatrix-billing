/**
 * Axios Instance Configuration
 * Centralized HTTP client with interceptors
 */

import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url, 'with method:', config.method);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth token');
    } else {
      console.log('No auth token found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    console.log('Response received:', response.status, response.data);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in localStorage
        localStorage.setItem(TOKEN_KEY, accessToken);
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth data and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        
        // Dispatch custom event for auth failure
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;
