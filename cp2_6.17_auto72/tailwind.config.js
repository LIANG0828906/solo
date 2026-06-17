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
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        forge: {
          bg: '#1E1E2E',
          surface: '#252540',
          border: '#444466',
          cyan: '#00E5FF',
          purple: '#7C4DFF',
          red: '#E74C3C',
          blue: '#3498DB',
          green: '#2ECC71',
        },
      },
    },
  },
  plugins: [],
};
