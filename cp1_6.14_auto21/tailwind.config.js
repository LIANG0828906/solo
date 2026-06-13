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
        haze: {
          50: '#f0f2f5',
          100: '#e1e5eb',
          200: '#c3cbda',
          300: '#a5b1c9',
          400: '#8797b8',
          500: '#6B7B8D',
          600: '#566a7c',
          700: '#43566a',
          800: '#304258',
          900: '#1d2e45',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        crimson: ['Crimson Pro', 'serif'],
        dm: ['DM Sans', 'sans-serif'],
        merri: ['Merriweather', 'serif'],
        source: ['Source Sans 3', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
