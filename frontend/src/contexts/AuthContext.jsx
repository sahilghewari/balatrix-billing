/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          
          // Optionally fetch fresh user data
          try {
            const response = await authService.getCurrentUser();
            if (response.data) {
              setUser(response.data);
            }
          } catch (error) {
            console.error('Failed to fetch current user:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events (from axios interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      toast.error('Session expired. Please login again.');
    };

    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success(response.message || 'Registration successful!');
      }
      
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success(response.message || 'Login successful!');
      }
      
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
    authService.setAuthData({}, userData);
  }, []);

  /**
   * Forgot password
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || 'Password reset email sent');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      toast.success(response.message || 'Password reset successful');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
      throw error;
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      toast.success(response.message || 'Password changed successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
      throw error;
    }
  }, []);

  /**
   * Verify email
   */
  const verifyEmail = useCallback(async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      toast.success(response.message || 'Email verified successfully');
      
      // Refresh user data
      if (isAuthenticated) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.data) {
          setUser(userResponse.data);
        }
      }
      
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to verify email');
      throw error;
    }
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
