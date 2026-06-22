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
        'debate-bg': '#1e1b4b',
        'debate-gold': '#fcd34d',
        'debate-pink': '#fdf2f8',
        'debate-pro': '#0d9488',
        'debate-con': '#e11d48',
        'debate-free': '#d97706',
        'debate-grid': '#e2e8f0',
        'debate-support': '#22c55e',
        'debate-refute': '#ef4444',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'node-enter': 'nodeEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'node-enter': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
