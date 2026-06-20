/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primary: { DEFAULT: '#4A90D9', hover: '#357ABD' },
        surface: { DEFAULT: '#2c2c2c', card: '#ffffff', border: '#e0e0e0' },
        muted: '#666666',
      },
    },
  },
  plugins: [],
}
