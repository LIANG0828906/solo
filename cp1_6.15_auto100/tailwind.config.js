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
        cafe: {
          bg: '#F5E6D0',
          primary: '#6F4E37',
          text: '#3E2723',
          light: '#FFF8F0',
          cream: '#FDF5E6',
          border: '#D4B896',
          hover: '#5D3F2E',
          accent: '#8B6914',
        },
        admin: {
          bg: '#263238',
          card: '#37474F',
          border: '#455A64',
          text: '#ECEFF1',
          muted: '#90A4AE',
          accent: '#80CBC4',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'scale-up': 'scaleUp 0.2s ease-out',
        'points-pop': 'pointsPop 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'delete-shrink': 'deleteShrink 0.3s ease-out forwards',
        'ripple': 'ripple 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        pointsPop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '40%': { transform: 'scale(1.25)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        deleteShrink: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.8)', opacity: '0.5', color: '#ef4444' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
