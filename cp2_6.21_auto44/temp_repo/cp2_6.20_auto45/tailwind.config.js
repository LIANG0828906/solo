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
        farm: {
          bg: '#f2e6d0',
          green: '#4a7c59',
          darkGreen: '#2d5a3d',
          yellow: '#f5e6a3',
          brown: '#8b6914',
          soil: '#6b4423',
          soilLight: '#8b5a2b',
          coop: '#e8f0fe',
          coopDark: '#1a3c64',
        }
      },
      animation: {
        'breathe': 'breathe 2s ease-in-out infinite',
        'float-up': 'floatUp 1s ease-out forwards',
        'particle': 'particle 0.8s ease-out forwards',
        'scale-pop': 'scalePop 0.3s ease-out',
        'progress-fill': 'progressFill 0.5s ease-out forwards',
        'stagger-in': 'staggerIn 0.5s ease-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.85' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-30px)', opacity: '0' },
        },
        particle: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' },
        },
        scalePop: {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        staggerIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
