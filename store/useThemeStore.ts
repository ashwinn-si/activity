'use client';

import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => {
  // Initialize from localStorage on creation
  const isDark = typeof window !== 'undefined'
    ? localStorage.getItem('theme') === 'dark'
    : true;

  return {
    isDark,
    toggleTheme: () => {
      set((state) => {
        const newIsDark = !state.isDark;
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
          document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
        }
        return { isDark: newIsDark };
      });
    },
  };
});

export default useThemeStore;
