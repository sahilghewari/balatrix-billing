/**
 * useAuth Hook
 * Custom hook for accessing authentication state and actions
 */

import { useAuthStore } from '@stores/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    setUser,
    setError,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    setUser,
    setError,
    clearError,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  };
};

export default useAuth;
