'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '@/store/useThemeStore';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  if (!mounted) return null;

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
