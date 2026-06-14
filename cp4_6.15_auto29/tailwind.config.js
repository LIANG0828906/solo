/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        morandi: {
          blue: '#7C98A6',
          'blue-dark': '#5F7A87',
          'blue-light': '#A3B8C2',
          gray: '#E8E6E1',
          'gray-dark': '#C8C5BF',
          white: '#F5F2ED',
          sand: '#D4C5B0',
          green: '#A8B5A0',
          'green-dark': '#8A9A82',
          red: '#B89087',
          'red-dark': '#9A756D',
          brown: '#9B8B7A',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(124, 152, 166, 0.12)',
        'card-hover': '0 8px 24px rgba(124, 152, 166, 0.2)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
