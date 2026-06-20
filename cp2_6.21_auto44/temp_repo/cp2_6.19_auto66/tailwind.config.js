/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'bg-primary': '#1E1E2E',
        'bg-secondary': '#2A2A3E',
        'bg-tertiary': '#3E3E5E',
        'text-primary': '#E0E0E0',
        'text-secondary': '#A0A0B0',
        'accent': '#7C4DFF',
        'accent-light': '#9B7BFF',
        'bank': '#4A90D9',
        'fund': '#50C878',
        'stock': '#FF6B6B',
        'bond': '#F59E0B',
        'gold': '#D4AF37',
        'other': '#94A3B8',
        'success': '#50C878',
        'danger': '#FF6B6B',
        'warning': '#FFD93D',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 24px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 12px rgba(124, 77, 255, 0.5)',
      },
      animation: {
        'shake': 'shake 0.2s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'zoom-out': 'zoomOut 0.2s ease-in forwards',
        'download': 'download 0.6s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-100%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoomOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
        download: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionProperty: {
        'transform-shadow': 'transform, box-shadow',
        'brightness-transform': 'filter, transform',
      },
    },
  },
  plugins: [],
};
