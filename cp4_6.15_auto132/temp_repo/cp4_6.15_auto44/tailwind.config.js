/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FDFBF8',
          100: '#F5F0EB',
          200: '#EBE3DA',
          300: '#DDD2C4',
        },
        fridge: {
          cold: '#EEF2F6',
          freeze: '#E3E9F0',
        },
        category: {
          vegetable: '#7BAE7F',
          fruit: '#E8A87C',
          meat: '#D4726A',
          dairy: '#E8E4DF',
          condiment: '#9EA7B0',
        },
        expiry: {
          warn: '#F59E0B',
          danger: '#EF4444',
        },
      },
      animation: {
        'blink': 'blink 1s ease-in-out infinite',
        'slide-in': 'slideIn 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out': 'slideOut 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'ripple': 'ripple 600ms ease-out',
        'bounce-hover': 'bounceHover 300ms ease',
        'fade-in': 'fadeIn 300ms ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOut: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        bounceHover: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
