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
        'dark-base': '#1e1e2e',
        'dark-surface': '#252535',
        'dark-text': '#cdd6f4',
        'dark-bg': '#181826',
        'dark-muted': '#6c7086',
      },
    },
  },
  plugins: [],
};
