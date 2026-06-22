/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
      },
    },
    extend: {
      colors: {
        orange: {
          primary: '#E8722A',
          light: '#F5A623',
          dark: '#C45A1C',
          50: '#FFF4EB',
          100: '#FFE4CC',
          200: '#FFC999',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          dark: '#FFF0E0',
        },
        olive: {
          DEFAULT: '#6B8E4E',
          light: '#8CB369',
          dark: '#4F6B38',
          50: '#F0F5EC',
          100: '#D8E6CE',
        },
        danger: '#DC3545',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(232, 114, 42, 0.08)',
        'card-hover': '0 12px 32px rgba(232, 114, 42, 0.18)',
        'soft': '0 1px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'card': '16px',
        'badge': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'progress-fill': 'progressFill 0.8s ease-out',
        'strike-out': 'strikeOut 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
        strikeOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.95)' },
          '100%': { opacity: '0', transform: 'scale(0.9)', height: '0', padding: '0', margin: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
