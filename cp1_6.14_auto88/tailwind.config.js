/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        gothic: {
          dark: '#1A1A2E',
          purple: '#2D1B4E',
          gold: '#D4AF37',
          light: '#4A3F6B',
        },
        forest: {
          dark: '#1A2E1A',
          green: '#2D4E2D',
          gold: '#8BA888',
          light: '#4A6B4A',
        },
        steampunk: {
          dark: '#2E2A1A',
          bronze: '#8B5A2B',
          gold: '#CD853F',
          light: '#6B5A3F',
        },
      },
    },
  },
  plugins: [],
};
