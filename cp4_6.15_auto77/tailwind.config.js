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
        olive: {
          50: '#f6f7ef',
          100: '#e8ecd4',
          200: '#d4dbad',
          300: '#b9c37d',
          400: '#9eab54',
          500: '#86943d',
          600: '#6B8E23',
          700: '#536f1e',
          800: '#44591e',
          900: '#3a4b1d',
          950: '#1e290b',
        },
        beige: {
          50: '#fbfbf5',
          100: '#F5F5DC',
          200: '#ebebca',
          300: '#dcdbae',
          400: '#c8c689',
          500: '#b4b067',
          600: '#9a944d',
          700: '#7d763e',
          800: '#666036',
          900: '#565130',
          950: '#302c17',
        },
        gold: {
          400: '#e5c04d',
          500: '#DAA520',
          600: '#c08716',
          700: '#a06614',
        },
      },
      fontFamily: {
        merriweather: ['Merriweather', 'serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-bottom': 'slideInBottom 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 0.5s ease-in-out 6',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInBottom: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { backgroundColor: '#DAA520' },
          '50%': { backgroundColor: '#f5d55a' },
        },
      },
    },
  },
  plugins: [],
};
