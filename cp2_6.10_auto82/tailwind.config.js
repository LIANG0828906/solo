/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tan-egg': '#f5e6d3',
        'tan-light': '#faf0e6',
        'tan-dark': '#e8d5b7',
        'wood-light': '#c4a46c',
        'wood-dark': '#8b5e3c',
        'wood-deep': '#5c3a1e',
        'bronze': '#8b7d6b',
        'ink': '#1a0a00',
        'jade-dark': '#2b5e3c',
        'jade-light': '#3a6a4a',
      },
      fontFamily: {
        kai: ['华文楷体', 'Noto Serif SC', 'serif'],
      },
    },
  },
  plugins: [],
}
