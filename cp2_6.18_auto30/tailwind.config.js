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
        brand: {
          50: '#f0eeff',
          100: '#ddd9ff',
          200: '#bbb3ff',
          300: '#998dff',
          400: '#7a6bff',
          500: '#6C63FF',
          600: '#5a4fe6',
          700: '#4840cc',
          800: '#3632b3',
          900: '#242399',
        },
        surface: {
          light: '#F8F9FA',
          dark: '#1A1D23',
        },
        card: {
          light: '#FFFFFF',
          dark: '#2D313A',
        },
        sidebar: {
          light: '#F0F1F3',
          dark: '#252830',
        },
        text: {
          light: '#212529',
          dark: '#E9ECEF',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.15)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'spin-slow': 'spin-slow 1s linear infinite',
        'check-pop': 'check-pop 0.4s ease-out forwards',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
