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
        navy: {
          50: '#F0F4F8',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#3B82F6',
          600: '#1E3A5F',
          700: '#172E4A',
          800: '#0F1F33',
          900: '#0A1628',
        },
        gold: {
          400: '#D4A574',
          500: '#C4956A',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(30,58,95,0.08)',
        'card-hover': '0 8px 24px rgba(30,58,95,0.15)',
        'input-focus': '0 0 0 3px rgba(59,130,246,0.2)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
