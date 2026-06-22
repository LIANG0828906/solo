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
        'paper': {
          50: '#faf5e6',
          100: '#f5e6c8',
          200: '#ebd5a5',
          300: '#dcc182',
        },
        'ink': {
          50: '#5d4037',
          100: '#4e342e',
          200: '#3e2723',
          300: '#2c1810',
        },
        'seal': {
          100: '#ef5350',
          200: '#c62828',
          300: '#b71c1c',
        },
        'bamboo': {
          100: '#c8d6bf',
          200: '#a8c29a',
          300: '#8ab37a',
        },
        'tibetan': {
          100: '#3d5a73',
          200: '#2c3e50',
          300: '#1a252f',
        },
      },
      fontFamily: {
        'calligraphy': ['"Ma Shan Zheng"', 'cursive'],
        'seal': ['"ZCOOL XiaoWei"', 'serif'],
        'song': ['"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        'ink': '0 4px 12px rgba(62, 39, 35, 0.3)',
        'paper': '0 2px 8px rgba(139, 119, 101, 0.2)',
        'fragment': '0 8px 24px rgba(62, 39, 35, 0.4)',
        'dragging': '0 16px 48px rgba(62, 39, 35, 0.5)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'ink-spread': 'inkSpread 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'scroll-unroll': 'scrollUnroll 1.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(200, 180, 120, 0.5)' },
          '50%': { boxShadow: '0 0 24px rgba(200, 180, 120, 0.8)' },
        },
        scrollUnroll: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
