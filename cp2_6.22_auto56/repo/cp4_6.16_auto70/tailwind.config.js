import type { TailwindColorsConfig } from 'tailwindcss/types/config';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B8C5A',
          light: '#7AA87A',
          dark: '#4A7A49',
        },
        'app-bg': '#F5F0E8',
        'app-card': '#FFFFFF',
        'app-text': '#2C3E2D',
        'app-text-light': '#6B7C6C',
        water: '#4A90D9',
        fertilize: '#E8913A',
        prune: '#8B5E3C',
        sunlight: '#F5B700',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(91, 140, 90, 0.08)',
        'card-hover': '0 8px 24px rgba(91, 140, 90, 0.15)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};
