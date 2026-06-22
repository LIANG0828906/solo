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
        terracotta: {
          50: '#FBF1EC',
          100: '#F5DCCB',
          200: '#EDBEA0',
          300: '#E29B75',
          400: '#D4866C',
          DEFAULT: '#C05A3A',
          600: '#B04E30',
          700: '#9B4529',
          800: '#6E301D',
          900: '#3D1B10',
          light: '#D4866C',
          dark: '#9B4529',
        },
        cream: {
          DEFAULT: '#F5E6D0',
          light: '#FAF3E6',
          dark: '#E8D3B0',
        },
        emerald: {
          DEFAULT: '#4A7C59',
          light: '#6DA27C',
        },
        navy: {
          DEFAULT: '#2C3E50',
          light: '#4A6572',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out both',
        fadeIn: 'fadeIn 0.3s ease-out both',
        slideInLeft: 'slideInLeft 0.4s ease-out both',
        pulseRing: 'pulseRing 0.8s cubic-bezier(0.24, 0, 0.38, 1) both',
        bounceScale: 'bounceScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        spinSlow: 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '50%': { transform: 'scale(1.1)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceScale: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
