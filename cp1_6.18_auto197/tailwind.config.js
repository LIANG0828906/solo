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
        dark: {
          bg: '#1A1A2E',
          card: '#2D2D44',
          border: '#3A3A5E',
        },
        moon: '#F0E68C',
        mood: {
          happy: '#FFD93D',
          calm: '#78C2AD',
          sad: '#A29BFE',
          miss: '#FF6B6B',
        },
        purple: {
          start: '#6C5CE7',
          end: '#A29BFE',
        },
        recall: '#E53935',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
