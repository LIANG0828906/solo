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
        primary: '#1e3a5f',
        accent: '#f28c28',
        background: '#f5f7fa',
        card: '#ffffff',
        border: '#e0e4e8',
      },
    },
  },
  plugins: [],
};
