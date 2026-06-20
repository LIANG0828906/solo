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
        dark: { DEFAULT: '#1a1a2e', 100: '#16213e', 200: '#0f3460' },
        gold: { DEFAULT: '#f2a900', light: '#ffd54f', dark: '#c68400' },
        morning: { from: '#c4b5fd', to: '#93c5fd' },
        evening: { from: '#1e3a5f', to: '#4c1d95' },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
