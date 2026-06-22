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
        amber: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FF8F00',
          800: '#FF6F00',
          900: '#E65100',
        },
        navy: {
          50: '#ECEFF1',
          100: '#CFD8DC',
          200: '#B0BEC5',
          300: '#90A4AE',
          400: '#78909C',
          500: '#607D8B',
          600: '#546E7A',
          700: '#455A64',
          800: '#37474F',
          900: '#2C3E50',
        },
        cream: '#FDF6E3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(44, 62, 80, 0.08)',
        cardHover: '0 8px 30px rgba(44, 62, 80, 0.15)',
      },
      borderRadius: {
        card: '14px',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 5s linear infinite',
        'bounce-number': 'bounceNumber 0.3s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'halo': 'halo 0.5s ease-in-out infinite',
        'fill-progress': 'fillProgress 0.8s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-up-down': 'scaleUpDown 0.5s ease-out',
      },
      keyframes: {
        bounceNumber: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.85)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px 2px rgba(255, 143, 0, 0.3)' },
          '50%': { boxShadow: '0 0 15px 4px rgba(255, 143, 0, 0.5)' },
        },
        halo: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 143, 0, 0.6), 0 0 4px 2px rgba(255, 143, 0, 0.2)' },
          '50%': { boxShadow: '0 0 0 4px rgba(255, 143, 0, 0), 0 0 8px 4px rgba(255, 143, 0, 0.4)' },
        },
        fillProgress: {
          '0%': { width: '0%' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUpDown: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
