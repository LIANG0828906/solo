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
        'dark-green': '#1F5C3B',
        'cream': '#F5F0E8',
        'amber': '#D4A017',
      },
    },
  },
  plugins: [],
};
