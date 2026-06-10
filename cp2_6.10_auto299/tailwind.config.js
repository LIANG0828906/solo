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
        'ancient': {
          'rice': '#f5e6c8',
          'vermilion': '#c0392b',
          'celadon': '#2e86c1',
          'wood': '#8b7355',
          'ink': '#2c2c2c',
        }
      },
      fontFamily: {
        'calligraphy': ['"Ma Shan Zheng"', 'cursive'],
        'serif-sc': ['"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
};
