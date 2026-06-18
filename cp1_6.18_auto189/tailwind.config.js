/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        primary: '#1A1A2E',
        sidebar: '#16213E',
        accent: '#0F3460',
        gold: '#E0B060',
        wood: '#D4A76A',
        card: '#2D2D44',
        purple: '#6C5CE7',
        'purple-hover': '#7E6BEA',
      },
    },
  },
  plugins: [],
};
