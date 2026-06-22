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
        rice: {
          50: '#FDFBF7',
          100: '#F9F5EC',
          200: '#F5F0E8',
          300: '#EDE5D5',
          400: '#E0D4BE',
          500: '#CFC0A5',
        },
        ink: {
          50: '#E8E8E8',
          100: '#B0B0B0',
          200: '#787878',
          300: '#505050',
          400: '#3A3A3A',
          500: '#2C2C2C',
          600: '#1F1F1F',
        },
        bark: {
          50: '#F5EDE6',
          100: '#E8D5C3',
          200: '#C9A882',
          300: '#A67C52',
          400: '#7D5A3A',
          500: '#5C3A21',
          600: '#3D2514',
        },
        jade: {
          50: '#EFF8F5',
          100: '#D0EDE6',
          200: '#A8DDD2',
          300: '#7BAEA1',
          400: '#5A9489',
          500: '#3D7A6E',
        },
        annot: {
          50: '#FFFDF5',
          100: '#FFF8DC',
          200: '#FFF3C4',
          300: '#FFEC9E',
        },
      },
      fontFamily: {
        wenkai: ['"LXGW WenKai"', 'serif'],
        serif: ['"Noto Serif SC"', 'serif'],
      },
      keyframes: {
        'star-pulse': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.3) rotate(18deg)', opacity: '0.8' },
        },
        'float-shadow': {
          '0%, 100%': { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
          '50%': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
        'card-hover': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bubble-expand': {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'star-pulse': 'star-pulse 0.6s ease-in-out',
        'float-shadow': 'float-shadow 2s ease-in-out infinite',
        'card-hover': 'card-hover 0.2s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'bubble-expand': 'bubble-expand 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
};
