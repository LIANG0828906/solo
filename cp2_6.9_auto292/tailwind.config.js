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
        'ma-shan': ['"Ma Shan Zheng"', 'cursive'],
      },
      colors: {
        'rouge': '#d35400',
        'mahogany': '#8b4513',
        'wood-light': '#e8dcc8',
        'gold': '#ffd700',
      },
      keyframes: {
        swing: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
      },
      animation: {
        swing: 'swing 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
