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
        deep: '#0a0e27',
        mid: '#1a1040',
        gold: '#d4a843',
        'gold-light': '#f0d68a',
        panel: '#1a2332',
        warrior: '#c0392b',
        'warrior-light': '#e74c3c',
        mage: '#8e44ad',
        'mage-light': '#a855f7',
        assassin: '#1a6b3c',
        'assassin-light': '#2ecc71',
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['Exo 2', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
