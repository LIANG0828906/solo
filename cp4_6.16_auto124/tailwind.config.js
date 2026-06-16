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
        pet: {
          bg: '#FFF8E7',
          card: '#FFFFFF',
          border: '#E0D6C8',
          sidebar: '#5D4037',
          text: '#3E2723',
          textLight: '#8D6E63',
          dry: '#FFD54F',
          wet: '#81C784',
          snack: '#FF8A65',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      transitionTimingFunction: {
        'pet': 'ease-in-out',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
