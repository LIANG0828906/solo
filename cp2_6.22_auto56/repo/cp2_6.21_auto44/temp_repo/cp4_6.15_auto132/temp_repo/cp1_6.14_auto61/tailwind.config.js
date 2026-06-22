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
        'deep-blue': '#0A1A3D',
        'deep-blue-light': '#122456',
        'bright-yellow': '#FFD700',
        'bright-yellow-dark': '#E6C200',
        'gold': '#FFD700',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'elastic-bounce': 'elastic-bounce 0.5s ease-out',
        'red-shake': 'red-shake 0.4s ease-out',
        'score-bounce': 'score-bounce 0.4s ease-out',
        'fade-flip': 'fade-flip 0.6s ease-out',
        'center-zoom': 'center-zoom 0.5s ease-out forwards',
        'rotate-rays': 'rotate-rays 4s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.05)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)' },
        },
        'elastic-bounce': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.35)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'red-shake': {
          '0%': { transform: 'translateX(0)', backgroundColor: '#ef4444' },
          '15%': { transform: 'translateX(-8px)' },
          '30%': { transform: 'translateX(8px)' },
          '45%': { transform: 'translateX(-6px)' },
          '60%': { transform: 'translateX(6px)' },
          '75%': { transform: 'translateX(-2px)' },
          '100%': { transform: 'translateX(0)', backgroundColor: '#FFD700' },
        },
        'score-bounce': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.4)' },
          '50%': { transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-flip': {
          '0%': { opacity: '0', transform: 'rotateX(90deg)' },
          '100%': { opacity: '1', transform: 'rotateX(0deg)' },
        },
        'center-zoom': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'rotate-rays': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
