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
        nordic: {
          primary: '#7C8BA2',
          warm: '#F5F2EB',
          sand: '#E8DCC6',
          floor: '#F0ECE3',
        },
        station: {
          available: '#A8E6CF',
          reserved: '#A3C4F3',
          occupied: '#FFB07C',
        },
        feed: {
          bg: '#F8F9FA',
          bubble: '#E9ECEF',
          self: '#007BFF',
          reserve: '#E74C3C',
          release: '#27AE60',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      transitionDuration: {
        '300': '300ms',
      },
      keyframes: {
        pulse_soft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.03)' },
        },
      },
      animation: {
        pulse_soft: 'pulse_soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
