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
          50: '#F0F0FF',
          100: '#E0E0FF',
          200: '#C4C2FF',
          300: '#A8A4FF',
          400: '#8C86FF',
          500: '#6C63FF',
          600: '#5A52D9',
          700: '#4841B3',
          800: '#36308C',
          900: '#241F66',
        },
        accent: {
          teal: '#4ECDC4',
          pink: '#FF6584',
        },
        surface: {
          900: '#1A1A2E',
          800: '#1E1E2E',
          700: '#2D2D44',
          600: '#3D3D5C',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-out': 'fadeInOut 2s ease-in-out forwards',
        'underline-expand': 'underlineExpand 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.9)' },
          '15%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          '85%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.9)' },
        },
        underlineExpand: {
          '0%': { width: '0', opacity: '0' },
          '100%': { width: '75%', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
