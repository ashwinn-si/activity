import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#f5f5f5',
        border: '#e5e5e5',
        muted: '#f0f0f0',
        text: {
          primary: '#1f1f1f',
          secondary: '#666666',
          muted: '#999999',
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
