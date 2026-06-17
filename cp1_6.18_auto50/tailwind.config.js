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
        base: {
          DEFAULT: '#0B0E27',
          card: '#1A1A2E',
          border: '#2A2A44',
          hover: '#3A3A5C',
        },
        accent: {
          DEFAULT: '#4ECDC4',
        },
        mood: {
          happy: '#6BCB77',
          calm: '#4ECDC4',
          unhappy: '#FF6B6B',
        },
        activity: {
          feeding: '#FFD93D',
          walking: '#6BCB77',
          playing: '#4ECDC4',
          resting: '#FF6B6B',
        },
        text: {
          primary: '#E0E0E0',
          secondary: '#A0A0A0',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.2s ease-out forwards',
        'modal-in': 'modalIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
