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
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
      },
      colors: {
        cream: '#FFF8E7',
        'light-blue': '#E3F2FD',
        coral: '#FF7043',
        'error-spelling': '#E53935',
        'error-punctuation': '#FB8C00',
        'error-grammar': '#8E24AA',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'pop-in': 'popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
