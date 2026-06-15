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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'serif'],
      },
      colors: {
        'tea-bg': '#F9F6F0',
        'tea-wood': '#8B5E3C',
        'tea-wood-dark': '#6B4828',
        'tea-green': '#6B8E23',
        'tea-green-dark': '#556B2F',
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        'tea': '300ms',
      },
    },
  },
  plugins: [],
};
