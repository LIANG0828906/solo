/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#EEF2FF',
        },
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(30px)', opacity: '0' },
        },
        fadeInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flipCard: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        checkmark: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        slideUp: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        slideDown: 'slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        fadeInDown: 'fadeInDown 300ms ease-out forwards',
        flipCard: 'flipCard 400ms ease-in-out',
        checkmark: 'checkmark 400ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
