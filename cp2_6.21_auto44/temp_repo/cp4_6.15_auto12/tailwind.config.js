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
          50: '#faf6f0',
          100: '#f0e8d8',
          200: '#e0cfae',
          300: '#cbb07e',
          400: '#b8955a',
          500: '#8B6F47',
          600: '#7a603d',
          700: '#654e32',
          800: '#513f2a',
          900: '#3d301f',
        },
        olive: {
          50: '#f4f7ec',
          100: '#e5edcf',
          200: '#cedba0',
          300: '#b3c56d',
          400: '#9db549',
          500: '#6B8E23',
          600: '#5a7a1d',
          700: '#4a6518',
          800: '#3c5116',
          900: '#324314',
        },
        cream: {
          50: '#FFFDF8',
          100: '#FFF8F0',
          200: '#FFF0DC',
          300: '#FFE4C0',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};
