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
        primary: '#D2A679',
        secondary: '#F5E6D0',
        accent: '#A0522D',
        bg: '#FAF5EE',
      },
    },
  },
  plugins: [],
};
