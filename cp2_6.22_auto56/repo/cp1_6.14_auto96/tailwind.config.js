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
        'wine-red': '#4A0E1C',
        'wine-dark': '#2A0E15',
        'warm-gold': '#C9A962',
        'gold-light': '#E8D5A3',
        'oak-dark': '#2A1810',
        'oak-medium': '#3D2518',
        'cork': '#F5E6D3',
        'cork-dark': '#D4C4A8',
        'bordeaux': '#722F37',
        'napa': '#E67E22',
        'tuscany': '#2D5016',
        'burgundy-region': '#5B2C6F',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
