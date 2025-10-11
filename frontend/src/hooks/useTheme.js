/**
 * useTheme Hook
 * Custom hook for accessing theme state and actions
 */

import { useThemeStore } from '@stores/themeStore';

export const useTheme = () => {
  const {
    theme,
    systemTheme,
    setTheme,
    toggleTheme,
    setSystemTheme,
    initTheme,
  } = useThemeStore();

  return {
    theme,
    systemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    setTheme,
    toggleTheme,
    setSystemTheme,
    initTheme,
  };
};

export default useTheme;
