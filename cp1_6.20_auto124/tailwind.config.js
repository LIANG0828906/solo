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
        warmWhite: '#F5F0E1',
        darkBrown: '#3E2C1C',
        antiqueGold: '#C9A96E',
        parchment: '#FDF8EF',
        leather: '#5C3D2E',
        ink: '#1A1208',
        goldLight: '#E0C992',
        goldDark: '#A07D3A',
        cream: '#FFF8E7',
        sepia: '#704214',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Crimson Pro', 'serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        parallaxFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.6s ease-out forwards',
        scaleIn: 'scaleIn 0.4s ease-out forwards',
        parallaxFloat: 'parallaxFloat 6s ease-in-out infinite',
      },
      spacing: {
        'book-gap': '2rem',
        'book-pad': '1.5rem',
        'book-wide': '6rem',
      },
      borderRadius: {
        'book': '4px',
        'book-lg': '8px',
      },
    },
  },
  plugins: [],
};
