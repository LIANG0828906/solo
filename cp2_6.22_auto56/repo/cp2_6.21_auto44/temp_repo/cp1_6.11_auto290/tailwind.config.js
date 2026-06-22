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
        'ancient-bg': '#F5F0E1',
        'ancient-brown': '#4A2C1A',
        'ancient-input': '#FFF8DC',
        'ancient-red': '#8B0000',
        'gold': '#D4AF37',
        'silver': '#C0C0C0',
        'bronze': '#CD7F32',
      },
      fontFamily: {
        title: ['LiSu', 'STLiti', 'serif'],
      },
    },
  },
  plugins: [],
};
