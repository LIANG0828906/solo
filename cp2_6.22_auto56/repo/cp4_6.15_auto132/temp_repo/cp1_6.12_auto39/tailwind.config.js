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
        primary: {
          bg: '#FFF3E0',
          text: '#5D4037',
          light: '#8D6E63',
        },
        success: '#66BB6A',
        danger: '#E53935',
        warning: '#FFB74D',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-expiry': 'pulse-expiry 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out forwards',
        'shrink-out': 'shrink-out 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out',
        'expand-height': 'expand-height 0.3s ease-out',
      },
      keyframes: {
        'pulse-expiry': {
          '0%, 100%': { backgroundColor: 'rgba(229, 57, 53, 0.1)' },
          '50%': { backgroundColor: 'rgba(229, 57, 53, 0.3)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'shrink-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'expand-height': {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
