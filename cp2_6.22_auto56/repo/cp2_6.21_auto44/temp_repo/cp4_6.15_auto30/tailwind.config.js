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
        cream: {
          50: '#FFF8F0',
          100: '#F5E6D3',
          200: '#EEDCC4',
          300: '#E6D0B5',
          400: '#D4B896',
          500: '#C4A07A',
          600: '#B08B62',
          700: '#8B6914',
          800: '#6B4F30',
          900: '#4A3620',
        }
      },
      fontFamily: {
        display: ['"ZCOOL XiaoWei"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
