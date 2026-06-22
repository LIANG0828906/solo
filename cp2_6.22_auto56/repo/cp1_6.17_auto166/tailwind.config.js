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
        primary: '#2C3E50',
        accent: '#E67E22',
        'accent-hover': '#D35400',
        surface: '#FAFAFA',
        'surface-alt': '#F8F8F8',
        'surface-muted': '#F5F5F5',
        border: '#E0E0E0',
        'frame-gold': '#B8860B',
        'heart-red': '#E74C3C',
        'tag-landscape': '#3498DB',
        'tag-portrait': '#2ECC71',
        'tag-documentary': '#E67E22',
        'tag-abstract': '#9B59B6',
        'hall-dark-1': '#1A1A2E',
        'hall-dark-2': '#16213E',
        'hall-panel': '#2C3E50',
      },
      borderRadius: {
        'card': '8px',
        'panel': '12px',
      },
      transitionDuration: {
        '300': '300ms',
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};
