/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nord: {
          bg: '#2E3440',
          accent: '#88C0D0',
          card: '#ECEFF4',
          danger: '#BF616A',
          textDark: '#4C566A',
          textLight: '#D8DEE9',
          sidebar: '#ECF0F1',
          hover: '#D5E8D4',
          progress: '#3498DB',
          primary: '#1ABC9C',
          navbar: '#2C3E50',
        }
      }
    },
  },
  plugins: [],
}
