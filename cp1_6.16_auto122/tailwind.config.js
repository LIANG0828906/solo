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
        dream: {
          bg: '#121212',
          panel: '#1E1E1E',
          border: '#333333',
          text: '#E0E0E0',
          purple: '#BB86FC',
          'blue-purple': '#6200EA',
          calm: '#A8D8EA',
          joy: '#F7C948',
          sad: '#6A9FB5',
          fear: '#8B5E83',
          anger: '#D94A4A',
          chaos: '#B0A1C8',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
