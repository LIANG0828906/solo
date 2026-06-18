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
        primary: {
          50: '#EBF2FC',
          100: '#D6E5F9',
          200: '#ADCAF3',
          300: '#84AFF0',
          400: '#5B94E5',
          500: '#4A90D9',
          600: '#3A7BC4',
          700: '#2D62A0',
          800: '#21497C',
          900: '#153058',
        },
        accent: {
          50: '#FEF5E7',
          100: '#FDECCF',
          200: '#FBD99F',
          300: '#F9C66F',
          400: '#F7B33F',
          500: '#F5A623',
          600: '#D48E1A',
          700: '#A36E14',
          800: '#724F0E',
          900: '#413008',
        },
        surface: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
        reserved: '#FBBF24',
        picked: '#34D399',
        returned: '#9CA3AF',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
        'drag': '0 20px 40px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-top': 'slideInFromTop 0.4s ease-out',
        'scale-bounce': 'scaleBounce 0.15s ease-out',
        'elastic-bounce': 'elasticBounce 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ripple': 'ripple 0.6s linear',
        'card-click': 'cardClick 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'underline': 'underline 0.3s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromTop: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        elasticBounce: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        cardClick: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(0.95)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        underline: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      screens: {
        'xs': '360px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1200px',
      },
    },
  },
  plugins: [],
};
