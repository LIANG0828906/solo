/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'sea-blue': {
          DEFAULT: '#5B9BD5',
          50: '#EEF5FC',
          100: '#D5E7F6',
          200: '#A9CFEE',
          300: '#7FB6E5',
          400: '#5B9BD5',
          500: '#4181BB',
          600: '#326896',
          700: '#254E71',
          800: '#18354C',
          900: '#0D1C27',
        },
        'warm-sand': {
          DEFAULT: '#F4D03F',
          50: '#FEF9E4',
          100: '#FDF1BE',
          200: '#FBE787',
          300: '#F9DD54',
          400: '#F4D03F',
          500: '#D8B018',
          600: '#A88812',
          700: '#78610D',
          800: '#483A08',
          900: '#1A1503',
        },
        'soft-bg': '#F2F3F4',
        'weekly-bg': '#EFF3F7',
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(91, 155, 213, 0.08)',
        'card-hover': '0 8px 24px rgba(91, 155, 213, 0.18)',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOutFly: {
          '0%': { opacity: '1', transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translate(80px, -60px) rotate(15deg)' },
        },
        bounceInput: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        hourglassSpin: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
        },
        flashDim: {
          '0%, 100%': { background: 'rgba(0, 0, 0, 0)' },
          '25%, 75%': { background: 'rgba(0, 0, 0, 0.55)' },
          '50%': { background: 'rgba(0, 0, 0, 0.25)' },
        },
        particle: {
          '0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--px), var(--py)) scale(0.3)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-24px)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(24px)' },
        },
        slideWeekLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.3s ease-out both',
        fadeOutFly: 'fadeOutFly 0.6s ease-in forwards',
        bounceInput: 'bounceInput 0.35s ease',
        hourglassSpin: 'hourglassSpin 1.6s ease-in-out infinite',
        flashDim: 'flashDim 1.6s ease-in-out 2',
        slideInLeft: 'slideInLeft 0.3s ease-out both',
        slideInRight: 'slideInRight 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
