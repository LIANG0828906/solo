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
        coral: {
          50: '#FFF5E6',
          100: '#FFE5E5',
          200: '#FFD0D0',
          300: '#FFB26B',
          400: '#FF8E8E',
          500: '#FF6B6B',
          600: '#E85555',
        },
      },
      animation: {
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'heart-beat': 'heartBeat 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
};
