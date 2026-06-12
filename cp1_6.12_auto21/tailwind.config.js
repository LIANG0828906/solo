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
        wood: {
          DEFAULT: '#8B5A2B',
          light: '#A0723C',
          dark: '#6B4226',
          50: '#F5F0E8',
          100: '#EDE5D8',
          200: '#DDD0BB',
          300: '#C9B494',
          400: '#A0723C',
          500: '#8B5A2B',
          600: '#6B4226',
          700: '#523119',
          800: '#3D240F',
          900: '#2A180A',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C964',
          dark: '#B8941F',
        },
        cream: '#F5F0E8',
        category: {
          literature: '#4A90D9',
          science: '#27AE60',
          history: '#E67E22',
          art: '#8E44AD',
          children: '#F1C40F',
          lifestyle: '#E91E8B',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 1s ease-in-out infinite alternate',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fill-progress': 'fillProgress 2s ease-in-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(212, 175, 55, 0.7)' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 8px 3px rgba(231, 76, 60, 0.6)' },
          '100%': { boxShadow: '0 0 8px 3px rgba(46, 204, 113, 0.6)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fillProgress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
