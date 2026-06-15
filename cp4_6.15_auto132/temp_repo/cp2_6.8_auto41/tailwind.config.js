/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#121212',
        'card-dark': '#1e1e1e',
        'accent': '#bb86fc',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flash-gold': 'flash-gold 0.5s ease-in-out',
        'countdown-blink': 'countdown-blink 1s ease-in-out infinite',
        'firework': 'firework 2s ease-out forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(187, 134, 252, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(187, 134, 252, 0.6)' },
        },
        'flash-gold': {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: 'transparent' },
          '50%': { transform: 'scale(1.1)', backgroundColor: 'rgba(255, 215, 0, 0.3)' },
        },
        'countdown-blink': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
        },
        'firework': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: '1' },
          '100%': { transform: 'translateY(-400px) scale(1)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
