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
        'morandi-gray-blue': '#6A7C8F',
        'morandi-warm-beige': '#F5EFE6',
        'morandi-white': '#FFFFFF',
        'morandi-dark-gray': '#333333',
        'morandi-medium-gray': '#666666',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(10deg)' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(106, 124, 143, 0.3)' },
          '50%': { borderColor: 'rgba(106, 124, 143, 0.8)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float-number': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-30px)', opacity: '0' },
        },
        'coin-fall': {
          '0%': { transform: 'translateY(-50px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(100px) rotate(360deg)', opacity: '0' },
        },
      },
      animation: {
        wave: 'wave 1s ease-in-out infinite',
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.5s ease-out forwards',
        'float-number': 'float-number 1s ease-out forwards',
        'coin-fall': 'coin-fall 1.5s ease-in forwards',
      },
    },
  },
  plugins: [],
};
