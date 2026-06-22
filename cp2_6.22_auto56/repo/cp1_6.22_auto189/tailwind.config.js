/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F472B6',
        'primary-dark': '#EC4899',
        secondary: '#FCE7F3',
        'text-primary': '#4A0E3B',
        'text-secondary': '#831843',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
