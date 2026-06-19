/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a2332',
        'primary-light': '#243044',
        'primary-dark': '#0f172a',
        'accent-blue': '#3b82f6',
        'accent-orange': '#f59e0b',
      },
    },
  },
  plugins: [],
}
