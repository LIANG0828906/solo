/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primary: '#f5a623',
        'primary-light': '#ffb84d',
        'primary-dark': '#d48d14',
        secondary: '#4a90d9',
        'secondary-light': '#6ba6e2',
        background: '#fff8f3',
        surface: '#ffffff',
        'surface-hover': '#fff3e6',
        vegetable: '#81c784',
        meat: '#ef9a9a',
        spice: '#fff176',
        dairy: '#b39ddb',
        grain: '#d7ccc8',
        seafood: '#81d4fa',
      },
      fontFamily: {
        display: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'cursive', 'serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', '"Ma Shan Zheng"', 'cursive'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        card: '12px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        pop: 'pop 0.2s ease-out',
        'toast-in': 'toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
}
