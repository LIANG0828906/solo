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
        olive: {
          50: '#f4f7ec',
          100: '#e6edda',
          200: '#cddcb5',
          300: '#abc484',
          400: '#8fb25e',
          500: '#6B8E23',
          600: '#5a7a1c',
          700: '#476117',
          800: '#384e14',
          900: '#2f3f13',
        },
        cream: {
          50: '#FFFDF5',
          100: '#FFF9E8',
          200: '#FFF3D1',
          300: '#FFEAB3',
        },
        bark: {
          50: '#f5f0eb',
          100: '#e8ddd2',
          200: '#d1bba5',
          300: '#b69478',
          400: '#9a7355',
          500: '#5C4033',
          600: '#4d352a',
          700: '#3f2b22',
          800: '#33231c',
          900: '#2b1e18',
        },
        severity: {
          mild: '#F59E0B',
          moderate: '#F97316',
          severe: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'ripple': 'ripple 0.6s linear',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'expand-x': 'expandX 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float-up': 'floatUp 0.3s ease-out',
        'progress': 'progress 1.5s ease-in-out',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        expandX: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};
