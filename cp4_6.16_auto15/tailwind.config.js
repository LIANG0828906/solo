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
        primary: {
          DEFAULT: '#1E3A5F',
          50: '#E8EEF5',
          100: '#D1DEEB',
          200: '#A3BDD7',
          300: '#759CC3',
          400: '#477BAF',
          500: '#1E3A5F',
          600: '#182E4C',
          700: '#122339',
          800: '#0C1726',
          900: '#060C13',
        },
        surface: {
          DEFAULT: '#F5F7FA',
          50: '#FFFFFF',
          100: '#F5F7FA',
          200: '#E8ECF1',
          300: '#D1D8E0',
        },
        danger: '#E74C3C',
      },
      borderRadius: {
        'card': '8px',
      },
      maxWidth: {
        'editor': '800px',
      },
    },
  },
  plugins: [],
};
