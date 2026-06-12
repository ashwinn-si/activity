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
      className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-accent-ride/40 transition-all duration-300"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
