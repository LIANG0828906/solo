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
        parchment: '#f5ead0',
        bark: {
          900: '#3e2723',
          700: '#4e342e',
          500: '#6d4c41',
          300: '#8d6e63',
          100: '#d7ccc8',
        },
        staff: {
          line: '#b0bec5',
          note: '#455a64',
          pulse: '#fff9c4',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      keyframes: {
        'green-flash': {
          '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.6)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(76, 175, 80, 0.4)' },
          '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
        },
        'note-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 249, 196, 0.7)' },
          '50%': { boxShadow: '0 0 16px 6px rgba(255, 249, 196, 0.4)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 249, 196, 0)' },
        },
        'btn-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'green-flash': 'green-flash 0.6s ease-out',
        'note-pulse': 'note-pulse 0.8s ease-in-out infinite',
        'btn-press': 'btn-press 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
