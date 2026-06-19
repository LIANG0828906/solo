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
        primary: '#4CAF50',
        secondary: '#FF9800',
        background: '#F5F5F0',
        text: '#333333',
        danger: '#E53935',
        border: '#E0E0E0',
      },
    },
  },
  plugins: [],
};
