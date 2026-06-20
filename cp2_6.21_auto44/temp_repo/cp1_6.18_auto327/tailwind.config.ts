import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'coffee-bg': '#1A1A2E',
        'coffee-card': '#16213E',
        'coffee-text': '#E0E0E0',
        'coffee-accent': '#FFD700',
        'coffee-accent2': '#FF6347',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'coffee': '12px',
      },
      boxShadow: {
        'coffee-inner': 'inset 0 0 3px rgba(0,0,0,0.4)',
        'coffee-glow': '0 8px 32px rgba(255,215,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'ripple': 'ripple 1.5s ease-out infinite',
        'slide-up': 'slideUp 500ms ease-out',
        'pulse-wave': 'pulseWave 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseWave: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'coffee': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '500': '500ms',
      },
    },
  },
  plugins: [],
};

export default config;
