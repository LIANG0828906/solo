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
        coffee: {
          50: '#FFF8F0',
          100: '#F5E6D3',
          200: '#E8D0B3',
          300: '#D4B896',
          400: '#C4A07A',
          500: '#8D6E63',
          600: '#6D4C41',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
        },
        amber: {
          DEFAULT: '#FFBF00',
          dark: '#E5AC00',
          light: '#FFD54F',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        pulse_stat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        bounce_tag: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        fade_in: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slide_in_right: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slide_out_right: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        pulse_stat: 'pulse_stat 2s ease-in-out infinite',
        bounce_tag: 'bounce_tag 300ms ease-out',
        fade_in: 'fade_in 300ms ease-out forwards',
        slide_in_right: 'slide_in_right 300ms ease-out',
        slide_out_right: 'slide_out_right 300ms ease-in',
        ripple: 'ripple 600ms ease-out',
      },
    },
  },
  plugins: [],
};
