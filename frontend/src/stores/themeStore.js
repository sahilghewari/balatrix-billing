/**
 * Theme Store
 * Zustand store for theme management (light/dark mode)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@utils/constants';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'light', // 'light' | 'dark'
      systemTheme: false, // Whether to use system preference

      // Actions
      setTheme: (theme) => {
        set({ theme });
        
        // Update document class
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      setSystemTheme: (useSystem) => {
        set({ systemTheme: useSystem });
        
        if (useSystem) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          get().setTheme(prefersDark ? 'dark' : 'light');
        }
      },

      initTheme: () => {
        const { theme, systemTheme } = get();
        
        if (systemTheme) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          get().setTheme(prefersDark ? 'dark' : 'light');
        } else {
          get().setTheme(theme);
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          if (get().systemTheme) {
            get().setTheme(e.matches ? 'dark' : 'light');
          }
        });
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
    }
  )
);

export default useThemeStore;
