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
        ocean: {
          DEFAULT: '#246A73',
          light: '#2D8A95',
          dark: '#1A4F56',
        },
        'warm-gray': '#F5F3EE',
        'cat-programming': '#3B82F6',
        'cat-art': '#F87171',
        'cat-life': '#22C55E',
        'cat-sports': '#F97316',
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
