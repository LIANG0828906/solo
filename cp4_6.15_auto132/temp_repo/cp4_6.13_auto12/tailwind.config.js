/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1e1e2e',
        'bg-secondary': '#2a2a3e',
        'bg-tertiary': '#33334d',
        'accent-primary': '#7c6fff',
        'accent-secondary': '#f5c542',
        'text-primary': '#e4e4e7',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 300ms ease-out',
        'shrink-out': 'shrinkOut 200ms ease-in forwards',
        'badge-pop': 'badgePop 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'chart-draw': 'chartDraw 1500ms ease-out forwards',
        'particle-burst': 'particleBurst 600ms ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shrinkOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
        badgePop: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-180deg)' },
          '50%': { transform: 'scale(1.2) rotate(180deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(360deg)' },
        },
        chartDraw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        particleBurst: {
          '0%': { opacity: '1', transform: 'scale(0) translate(0, 0)' },
          '100%': { opacity: '0', transform: 'scale(1) translate(var(--tx), var(--ty))' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
