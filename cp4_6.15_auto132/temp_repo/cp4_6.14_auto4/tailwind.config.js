/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'gallery-bg': '#0f172a',
        'gallery-accent': '#06b6d4',
        'gallery-accent-hover': '#0891b2',
        'gallery-card': 'rgba(15, 23, 42, 0.9)',
      },
      transitionTimingFunction: {
        'gallery': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'gallery': '0 4px 20px rgba(6, 182, 212, 0.15), 0 0 40px rgba(6, 182, 212, 0.05)',
        'gallery-hover': '0 6px 30px rgba(6, 182, 212, 0.25), 0 0 60px rgba(6, 182, 212, 0.1)',
      },
    },
  },
  plugins: [],
};
