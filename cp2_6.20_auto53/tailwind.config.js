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
          bg: '#1a2332',
          card: 'rgba(255, 255, 255, 0.08)',
          gold: '#c9a84c',
          goldDark: '#a58b34',
          text: '#ccc',
          border: 'rgba(201, 168, 76, 0.3)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'gold-glow': '0 8px 32px rgba(201, 168, 76, 0.25)',
        'hover-soft': '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
        },
        blinkBadge: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 1.2s ease-in-out',
        'blink-badge': 'blinkBadge 0.6s ease-in-out 3',
      },
    },
  },
  plugins: [],
};
