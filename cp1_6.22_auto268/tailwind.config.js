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
        primary: '#6B8E23',
        'primary-dark': '#5A7A1E',
        'primary-light': '#A8D5BA',
        secondary: '#F5F5DC',
        header: '#4A6741',
        'card-bg': '#F4F9ED',
        'card-border': '#DCE8D0',
        'optimal-from': '#E8F5E9',
        'optimal-to': '#C8E6C9',
        'alt-bg': '#F5F5F5',
        'seedling': '#A8D5BA',
        'growing': '#F9D976',
        'harvest': '#F28B82',
        'chart-bar': '#4CAF50',
      },
    },
  },
  plugins: [],
};
