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
        warm: {
          50: '#FFF8F0',
          100: '#FFF0E0',
          200: '#FFE0C0',
          300: '#FFD0A0',
          400: '#FFB347',
          500: '#FF9500',
          600: '#E07800',
          700: '#C06000',
        },
        chinese: {
          from: '#FF4444',
          to: '#FF8C00',
        },
        western: {
          from: '#4A6CF7',
          to: '#9B59B6',
        },
        japanese: {
          from: '#00C9A7',
          to: '#2ECC71',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'heart-beat': 'heartBeat 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'shrink-out': 'shrinkOut 0.3s ease-in forwards',
        'underline-in': 'underlineIn 0.3s ease-out forwards',
        'progress-fill': 'progressFill 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heartBeat: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-5px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(3px)' },
        },
        shrinkOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        underlineIn: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
};
