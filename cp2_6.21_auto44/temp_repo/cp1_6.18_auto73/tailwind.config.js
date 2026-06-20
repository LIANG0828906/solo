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
        primary: '#1A1A2E',
        surface: '#2D2D44',
        border: '#2A2A44',
        accent: {
          gold: '#FFD93D',
          green: '#6BCB77',
          greenLight: '#8DDF8D',
          teal: '#4ECDC4',
          coral: '#FF6B6B',
        },
        text: {
          main: '#E0E0E0',
          dim: '#9999AA',
        },
        scrollbar: '#4A4A6A',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-border': 'pulseBorder 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseBorder: {
          '0%': { borderColor: '#FFD93D', boxShadow: '0 0 8px #FFD93D66' },
          '100%': { borderColor: '#2A2A44', boxShadow: '0 0 0px transparent' },
        },
      },
    },
  },
  plugins: [],
};
