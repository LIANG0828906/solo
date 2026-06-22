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
        'deep-space': '#0D1117',
        'card-dark': '#161B22',
        'grid-bg-start': '#0A1929',
        'grid-bg-end': '#0D2137',
        'grid-line': '#1A365D',
        'electric-blue': '#38BDF8',
        'electric-blue-dark': '#0EA5E9',
        'deep-blue': '#1E3A5F',
        'warning-orange': '#F97316',
        'danger-red': '#EF4444',
        'success-green': '#10B981',
        'chat-opponent': '#2D3748',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)' },
          '50%': { boxShadow: '0 0 40px rgba(56, 189, 248, 0.9)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(2px, 2px), filter: blur(1px)' },
          '50%': { transform: 'translate(-2px, -2px), filter: blur(0)' },
          '75%': { transform: 'translate(2px, -2px), filter: blur(1px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        'hit-flash': {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0)' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
          '100%': { backgroundColor: 'rgba(239, 68, 68, 0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'hit-flash': 'hit-flash 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
