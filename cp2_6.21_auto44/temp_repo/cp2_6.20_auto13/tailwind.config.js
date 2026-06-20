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
        cream: '#FFF8F0',
        'cream-dark': '#FFF0E0',
        'warm-orange': '#FFB380',
        'warm-orange-deep': '#FF8A3D',
        'warm-brown': '#5D4037',
        'warm-brown-light': '#8D6E63',
        'warm-gold': '#FFD54F',
        'warm-gray': '#9E9E9E',
        'warm-bg': '#FFF5EB',
        'warm-card': '#FFFFFF',
        'warm-border': '#F0E0D0',
        'step-circle': '#A1887F',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      keyframes: {
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'star-bounce': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.3) translateY(-4px)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'crossfade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'crossfade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 0.3s ease-out forwards',
        'star-bounce': 'star-bounce 0.3s ease-out',
        'ripple': 'ripple 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'crossfade-in': 'crossfade-in 0.25s ease-out',
        'crossfade-out': 'crossfade-out 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
