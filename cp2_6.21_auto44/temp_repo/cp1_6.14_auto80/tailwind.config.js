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
        indigo: {
          dark: '#1E1E2E',
          deeper: '#141422',
          mid: '#2A2A3E',
        },
        cyber: {
          blue: '#00D2FF',
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
        surface: {
          glass: 'rgba(30, 30, 46, 0.7)',
          card: 'rgba(42, 42, 62, 0.6)',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-bottom': 'slideInBottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fly-out': 'flyOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'float-hover': 'floatHover 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'gear-rotate': 'gearRotate 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-expand': 'pulseExpand 1.5s ease-out infinite',
        'field-appear': 'fieldAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'shrink-click': 'shrinkClick 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'vu-bounce': 'vuBounce 0.1s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 210, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 210, 255, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideInBottom: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        flyOut: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.5) translateX(200px)', opacity: 0 },
        },
        floatHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-8px)' },
        },
        gearRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(15deg)' },
        },
        pulseExpand: {
          '0%': { transform: 'scale(1)', opacity: 0.8 },
          '100%': { transform: 'scale(2.5)', opacity: 0 },
        },
        fieldAppear: {
          '0%': { transform: 'translateX(-30px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        shrinkClick: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.85)' },
          '100%': { transform: 'scale(1)' },
        },
        vuBounce: {
          '0%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(0.5)' },
        },
      },
      backdropBlur: {
        glass: '10px',
      },
    },
  },
  plugins: [],
};
