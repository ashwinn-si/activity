'use client';

import { useLayoutEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '@/store/useThemeStore';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  useLayoutEffect(() => {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-muted hover:border-accent-ride/40 transition-all duration-300"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
