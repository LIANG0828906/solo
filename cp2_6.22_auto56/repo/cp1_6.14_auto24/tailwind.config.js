/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        'cream-dark': '#F0EAE0',
        brown: '#5C4033',
        'brown-light': '#7A5A47',
        'brown-dark': '#3E2A20',
        'marker-blue': '#4A7C9B',
        'marker-red': '#C45C4B',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'frosted': '0 8px 32px rgba(92, 64, 51, 0.15)',
        'hover': '0 12px 40px rgba(92, 64, 51, 0.25)',
      },
      animation: {
        'pulse-breath': 'pulse-breath 2.5s ease-in-out infinite',
        'float-up': 'float-up 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
}
