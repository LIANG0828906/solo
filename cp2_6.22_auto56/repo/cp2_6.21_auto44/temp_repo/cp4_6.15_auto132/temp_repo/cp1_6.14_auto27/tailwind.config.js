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
          50: '#E8F0FE',
          100: '#D0E1FC',
          200: '#A1C3FA',
          300: '#72A5F7',
          400: '#4387F5',
          500: '#2C3E50',
          600: '#243443',
          700: '#1C2A36',
          800: '#142029',
          900: '#0C161C',
        },
        surface: {
          DEFAULT: '#E8F0FE',
          dark: '#2C3E50',
          card: '#FFFFFF',
          hover: '#F0F4FA',
        },
        accent: {
          DEFAULT: '#3498DB',
          light: '#5DADE2',
          dark: '#2980B9',
        },
        warning: {
          DEFAULT: '#E74C3C',
          light: '#FF6B6B',
        },
        success: {
          DEFAULT: '#27AE60',
          light: '#2ECC71',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-warning': 'pulse-warning 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-warning': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
