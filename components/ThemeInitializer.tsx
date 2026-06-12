'use client';

import { useEffect } from 'react';
import useThemeStore from '@/store/useThemeStore';

export default function ThemeInitializer() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDark]);

  return null;
}
