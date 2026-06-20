/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a2e',
        'bg-card': '#16213e',
        'accent': '#0f3460',
        'accent-light': '#1a4a8a',
        'gold': '#ffd700',
        'text-primary': '#e0e0e0',
        'text-secondary': '#8892b0',
        'text-dim': '#5a6380',
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.4)',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
    },
  },
  plugins: [],
};
