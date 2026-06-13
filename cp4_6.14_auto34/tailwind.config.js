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
        'bg-primary': '#1e1e2e',
        'bg-secondary': '#2a2a3e',
        'bg-tertiary': '#3a3a5e',
        'accent-blue': '#6c8cff',
        'accent-purple': '#a855f7',
        'accent-green': '#22c55e',
        'accent-yellow': '#eab308',
        'accent-red': '#ef4444',
        'accent-orange': '#f97316',
        'accent-pink': '#ec4899',
        'accent-cyan': '#06b6d4',
      },
      animation: {
        'bounce-in': 'bounceIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 300ms ease',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
