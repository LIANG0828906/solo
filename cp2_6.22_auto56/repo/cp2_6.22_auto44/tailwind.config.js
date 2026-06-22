/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#d4e4fc',
          200: '#a9c8f8',
          300: '#7eacf4',
          400: '#5390f0',
          500: '#2874ec',
          600: '#1e3a5f',
          700: '#172f4f',
          800: '#10233f',
          900: '#09182f',
        },
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        pulseRed: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(255,77,79,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,77,79,0)' },
        },
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'shake-red': 'shake 0.4s ease-in-out, pulseRed 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
