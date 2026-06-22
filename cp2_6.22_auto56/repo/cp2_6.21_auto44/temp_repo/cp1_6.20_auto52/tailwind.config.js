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
        primary: {
          from: '#2C9EAF',
          to: '#3B82F6',
          DEFAULT: '#3299D3',
        },
        surface: '#F5F7FA',
        ticket: '#D1FAE5',
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-fade-in': 'slideFadeIn 0.4s ease-out',
        'seat-flash': 'seatFlash 0.5s ease-out',
        'hover-up': 'hoverUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        seatFlash: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#3B82F6' },
        },
        hoverUp: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
};
