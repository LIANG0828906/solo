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
        'exhibit-bg': '#1a1a2e',
        'exhibit-secondary': '#16213e',
        'exhibit-accent': '#0f3460',
        'exhibit-highlight': '#00d4ff',
        'exhibit-occlusion': '#FF4444',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 1s ease-in-out infinite',
        'spin-slow': 'spin 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
