import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        border: '#262626',
        muted: '#3a3a3a',
        text: {
          primary: '#f5f5f5',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        accent: {
          ride: '#f97316',
          run: '#3b82f6',
          walk: '#22c55e',
          pr: '#a855f7',
        },
        strava: '#fc4c02',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
