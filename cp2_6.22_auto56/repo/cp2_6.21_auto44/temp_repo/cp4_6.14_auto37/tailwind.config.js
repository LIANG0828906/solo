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
        warm: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#F39C12',
          500: '#E67E22',
          600: '#D35400',
          700: '#A04000',
          800: '#6D2F00',
          900: '#3E1A00',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.15)',
        'card-drag': '0 8px 24px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
};
