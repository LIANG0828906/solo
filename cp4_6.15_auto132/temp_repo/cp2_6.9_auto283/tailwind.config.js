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
        'wood-dark': '#3e2723',
        'paper': '#f5e6c8',
        'cinnabar': '#ff4500',
        'cinnabar-dark': '#d32f2f',
        'gold': '#d4a373',
        'red-sandalwood': '#4a2c1a',
      },
      fontFamily: {
        display: ['"Ma Shan Zheng"', 'serif'],
        body: ['"Noto Serif SC"', 'serif'],
      },
      transitionTimingFunction: {
        'guqin': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '5000': '5000ms',
      },
      animation: {
        'fade-in': 'fadeIn 2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'pluck': 'pluck 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pluck: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
