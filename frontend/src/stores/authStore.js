/**
 * Authentication Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@services/auth';
import { STORAGE_KEYS } from '@utils/constants';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: authService.getStoredUser(),
      isAuthenticated: authService.isAuthenticated(),
      loading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.login(credentials);
          set({
            user: data.user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return data;
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.register(userData);
          set({ loading: false, error: null });
          return data;
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      },

      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const updatedUser = await authService.updateProfile(profileData);
          set({
            user: { ...get().user, ...updatedUser },
            loading: false,
            error: null,
          });
          return updatedUser;
        } catch (error) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Profile update failed',
          });
          throw error;
        }
      },

      refreshProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user });
          return user;
        } catch (error) {
          console.error('Failed to refresh profile:', error);
          throw error;
        }
      },

      setUser: (user) => set({ user }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
