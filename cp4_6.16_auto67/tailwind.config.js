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
        'bg-primary': '#1a1a2e',
        'bg-card': 'rgba(38, 38, 60, 0.9)',
        'text-primary': '#e0e0e0',
        'text-secondary': '#a0a0b0',
        'accent': '#ffb347',
        'accent-light': '#ffc870',
        'accent-dark': '#e69a2e',
      },
      borderRadius: {
        'card': '12px',
      },
      transitionDuration: {
        'DEFAULT': '300ms',
        'fast': '200ms',
        'slow': '500ms',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(255, 179, 71, 0.4)',
      },
    },
  },
  plugins: [],
};
