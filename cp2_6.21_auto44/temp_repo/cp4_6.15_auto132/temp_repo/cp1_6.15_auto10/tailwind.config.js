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
        primary: '#FF6B35',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        success: '#4CAF50',
        error: '#F44336'
      }
    },
  },
  plugins: [],
};
