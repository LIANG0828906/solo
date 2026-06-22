/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0F172A',
        'panel-bg': '#1E293B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      screens: {
        'layout-sm': { 'max': '899px' },
      },
    },
  },
  plugins: [],
};
