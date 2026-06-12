/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1A1A2E',
          secondary: '#16213E',
        },
        accent: {
          primary: '#9C27B0',
          secondary: '#FF6F61',
        },
        status: {
          idle: '#E8F5E9',
          borrowed: '#FFF3E0',
          maintenance: '#FFEBEE',
          warningOrange: '#FFB74D',
          warningRed: '#FF5252',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-breath': 'pulseBreath 0.5s ease-in-out infinite',
        'border-pulse': 'borderPulse 0.3s ease-in-out infinite',
        'elastic-in': 'elasticIn 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
      },
      keyframes: {
        pulseBreath: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.7)' },
          '50%': { transform: 'scale(1.2)', opacity: '0.85', boxShadow: '0 0 0 10px rgba(156, 39, 176, 0)' },
        },
        borderPulse: {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(211, 47, 47, 0.4)' },
          '50%': { 'box-shadow': '0 0 0 6px rgba(211, 47, 47, 0)' },
        },
        elasticIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
