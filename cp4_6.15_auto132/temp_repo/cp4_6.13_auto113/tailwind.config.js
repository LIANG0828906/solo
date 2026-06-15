/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        beige: {
          DEFAULT: '#F5F0E8',
          dark: '#EDE7DB',
          deeper: '#E2D9C8',
        },
        olive: {
          DEFAULT: '#3D4F3C',
          light: '#5A7358',
          lighter: '#7A9478',
        },
        brown: '#8B7355',
        gold: '#C9B896',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease forwards',
        'slide-up': 'slide-up 0.2s ease forwards',
      },
    },
  },
  plugins: [],
};
