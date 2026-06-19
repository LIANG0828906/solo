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
        surface: {
          DEFAULT: '#1e1e2e',
          light: '#2a2a3d',
          lighter: '#353549',
          border: '#3e3e55',
        },
        indigo: {
          DEFAULT: '#4f46e5',
          light: '#6366f1',
          dark: '#4338ca',
          gradient: '#7c3aed',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      keyframes: {
        'breathe': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'fadeInUp': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scaleIn': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scalePulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'progressShine': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'breathe': 'breathe 2s ease-in-out infinite',
        'float': 'float 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
        'scaleIn': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scalePulse': 'scalePulse 3s ease-in-out infinite',
        'progressShine': 'progressShine 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
