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
          50: '#e3f6f8',
          100: '#b9e8ed',
          200: '#8ad8e2',
          300: '#5bc8d6',
          400: '#2bb9cb',
          500: '#00bcd4',
          600: '#00a3b8',
          700: '#008a9c',
          800: '#007180',
          900: '#005864',
        },
        dark: {
          50: '#e8e9eb',
          100: '#b5b9c0',
          200: '#828995',
          300: '#4f596a',
          400: '#1c283f',
          500: '#1a2332',
          600: '#151d29',
          700: '#101720',
          800: '#0b1117',
          900: '#060b0e',
        },
        gold: {
          400: '#ffd700',
          500: '#ffcc00',
          600: '#ffb347',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100px) rotate(720deg)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
