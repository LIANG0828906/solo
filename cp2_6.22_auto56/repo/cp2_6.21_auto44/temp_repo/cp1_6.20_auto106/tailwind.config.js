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
          DEFAULT: '#1a2a40',
          light: '#2a3f5a',
          dark: '#0f1a28',
        },
        background: {
          DEFAULT: '#f0f4f8',
          dark: '#e8edf2',
        },
        success: {
          DEFAULT: '#2ecc71',
          light: '#58d68d',
          dark: '#27ae60',
        },
        warning: {
          DEFAULT: '#f1c40f',
          light: '#f4d03f',
          dark: '#f39c12',
        },
        danger: {
          DEFAULT: '#e74c3c',
          light: '#ec7063',
          dark: '#c0392b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'pulse-urgent': 'pulseUrgent 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'checkin-flash': 'checkinFlash 0.8s ease-out',
        'checkmark': 'checkmark 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseUrgent: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(241, 196, 15, 0.4)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(241, 196, 15, 0.6)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        checkinFlash: {
          '0%': { backgroundColor: 'rgba(46, 204, 113, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        checkmark: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
