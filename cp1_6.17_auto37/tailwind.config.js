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
        'bg-primary': '#12121C',
        'bg-panel': '#1E1E2E',
        'bg-spectrum': '#2A2A3E',
        'bg-card': '#262640',
        'gold': '#D4AF37',
        'teal': '#4DD0E1',
        'info': '#B0BEC5',
        'blue-glow': '#64B5F6',
        'orange-peak': '#FF6B00',
        'blue-progress': '#42A5F5',
        'wood': '#5D4037',
      },
    },
  },
  plugins: [],
};
