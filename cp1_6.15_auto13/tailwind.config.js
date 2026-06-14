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
        wood: {
          50: '#FAF6F0',
          100: '#F5EDE0',
          200: '#E8D5B8',
          300: '#D4B896',
          400: '#C4A070',
          500: '#8B6914',
          600: '#7A5C12',
          700: '#694E10',
          800: '#58400E',
          900: '#47320C',
        },
        cream: '#FAF6F0',
        green: {
          light: '#E8F5E9',
          DEFAULT: '#7CB342',
          dark: '#558B2F',
        },
        orange: {
          light: '#FFF3E0',
          DEFAULT: '#FF8C00',
          dark: '#E65100',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-skeleton': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-left': 'slide-left 0.3s ease-in-out forwards',
        'check-pop': 'check-pop 0.4s ease-out',
        'pulse-skeleton': 'pulse-skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
