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
        'night-sky': '#0b0f2a',
        'star-gold': '#f5d742',
        'inscription-blue': '#d0e0f0',
        'crisis-red': '#c0392b',
        'celadon': '#8fbc8f',
      },
      fontFamily: {
        'serif': ['"Noto Serif SC"', 'serif'],
        'display': ['"ZCOOL XiaoWei"', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'meteor': 'meteor 1s linear forwards',
        'bounce-number': 'bounce-number 0.5s ease-out',
        'gold-spread': 'gold-spread 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out',
        'ring-progress': 'ring-progress 1s linear forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px #f5d742, 0 0 20px #f5d742' },
          '50%': { boxShadow: '0 0 20px #f5d742, 0 0 40px #f5d742' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'meteor': {
          '0%': { transform: 'translateY(-100%) translateX(0)', opacity: '1' },
          '100%': { transform: 'translateY(200%) translateX(100%)', opacity: '0' },
        },
        'bounce-number': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
        'gold-spread': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
