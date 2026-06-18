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
          50: '#F8F6FF',
          100: '#F5F3FF',
          200: '#E8E0F0',
          300: '#D4C4E8',
          400: '#7B68EE',
          500: '#6A5ACD',
          600: '#4A3B6B',
          700: '#3D2F5A',
          800: '#2E2347',
          900: '#1F1833',
        },
      },
      boxShadow: {
        card: '0 2px 8px rgba(106,90,205,0.08)',
        'card-hover': '0 4px 16px rgba(106,90,205,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
