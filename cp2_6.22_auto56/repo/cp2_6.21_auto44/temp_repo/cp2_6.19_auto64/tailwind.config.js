/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#8B9DAF',
        secondary: '#B5C0CA',
        background: '#F5F0EB',
        warning: '#E57373',
        success: '#81C784',
        'primary-dark': '#6B7D8F',
        'primary-light': '#A5B5C5',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(139, 157, 175, 0.1)',
        'card-hover': '0 10px 30px rgba(139, 157, 175, 0.2)',
        input: '0 0 0 3px rgba(139, 157, 175, 0.2)',
      },
      borderRadius: {
        card: '16px',
        input: '12px',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        pulseSlow: 'pulseSlow 2s ease-in-out infinite',
        scaleIn: 'scaleIn 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
