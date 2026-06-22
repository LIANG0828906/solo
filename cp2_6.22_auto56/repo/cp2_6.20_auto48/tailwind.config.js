/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          dark: '#4a2c1a',
          medium: '#5c3d2e',
          light: '#6b4423',
        },
        bar: {
          bg: '#1e2a35',
          dark: '#151d25',
        },
        gold: {
          light: '#f4d03f',
          dark: '#d4ac0d',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'shake': 'shake 2s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'green-flash': 'greenFlash 1s ease-in-out',
        'confetti-fall': 'confettiFall 3s ease-out forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px) rotate(-5deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px) rotate(5deg)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        greenFlash: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(34, 197, 94, 0.5)' },
        },
        confettiFall: {
          '0%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(200px) rotate(720deg)' },
        },
      },
    },
  },
  plugins: [],
}
