/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#00e5ff',
        secondary: '#a855f7',
        accent: '#ff6b6b',
        'bg-dark': '#0a0a1a',
        'bg-medium': '#1a1040',
        'bg-light': '#2d1b69',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
