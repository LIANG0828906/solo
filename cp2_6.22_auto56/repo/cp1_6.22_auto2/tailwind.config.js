/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-blue': '#0a1628',
        'dark-green': '#0d3b2e',
        'low-alt': '#1a5c3a',
        'high-alt': '#d4c472',
        'sky-top': '#0a1628',
        'sky-mid': '#1a3a5c',
        'sky-bot': '#4a8ab5',
        'panel-bg': 'rgba(10, 22, 40, 0.75)',
        'panel-border': 'rgba(74, 138, 181, 0.3)',
        'accent': '#4a8ab5',
        'accent-glow': '#6bb8e8',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Noto Sans SC', 'sans-serif'],
      },
      backdropBlur: {
        'panel': '16px',
      },
      animation: {
        'pulse-text': 'pulseText 1.5s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
      },
      keyframes: {
        pulseText: {
          '0%, 100%': { opacity: '1.0' },
          '50%': { opacity: '0.3' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
