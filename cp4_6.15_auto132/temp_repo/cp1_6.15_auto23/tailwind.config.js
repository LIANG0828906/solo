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
        cream: '#FAF7F2',
        latte: '#D4C5B2',
        coffee: '#8B7355',
        espresso: '#5C3D2E',
        forest: {
          DEFAULT: '#2D6A4F',
          light: '#40916C',
          pale: '#B7E4C7',
        },
        'warm-white': '#FDFCF9',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(92, 61, 46, 0.08)',
        hover: '0 8px 24px rgba(92, 61, 46, 0.15)',
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
};
