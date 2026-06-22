/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        creamDark: '#F5EDE3',
        warmOrange: '#FF8C42',
        warmOrangeLight: '#FFB07A',
        warmOrangeDark: '#E67530',
        wood: '#C4956A',
        woodLight: '#D9B58E',
        woodDark: '#A67A50',
        sage: '#7BA05B',
        sageLight: '#9DC47A',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(196, 149, 106, 0.12)',
        softHover: '0 8px 30px rgba(196, 149, 106, 0.2)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shrinkFade: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
        riseFlash: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '50%': { opacity: '1', transform: 'translateY(-5px)', backgroundColor: '#9DC47A' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%, 100%': { backgroundColor: '#7BA05B' },
          '50%': { backgroundColor: '#9DC47A' },
        },
        dropdown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        slideInRight: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        slideOutRight: 'slideOutRight 0.3s ease-in forwards',
        shrinkFade: 'shrinkFade 0.4s ease-in forwards',
        riseFlash: 'riseFlash 0.8s ease-out forwards',
        pulseGreen: 'pulseGreen 0.6s ease-in-out 2',
        dropdown: 'dropdown 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
