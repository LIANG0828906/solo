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
        sand: {
          50: '#FAF6F0',
          100: '#F5EFE6',
          200: '#E8DCC8',
          300: '#D4C4A8',
          400: '#C4A574',
          500: '#B08950',
          600: '#8B6914',
          700: '#6B5210',
          800: '#4A380B',
          900: '#2D2207',
        },
        earth: {
          500: '#E07A5F',
          600: '#D16A4F',
        },
        sage: {
          500: '#81B29A',
          600: '#6BA088',
        },
        slate: {
          600: '#3D405B',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-left': 'slideLeft 0.4s ease-out forwards',
        'spin-slow': 'spin 1s linear infinite',
        'progress': 'progress 1.5s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '70%', marginLeft: '30%' },
          '100%': { width: '0%', marginLeft: '100%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
