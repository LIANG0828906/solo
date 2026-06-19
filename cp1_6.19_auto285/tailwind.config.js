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
        'bg-primary': '#1A1A24',
        'bg-panel': '#2C2C3A',
        'bg-scene': '#1E1E24',
        'bg-warm': '#4A3B32',
        'text-primary': '#E0E0FF',
        'text-secondary': '#8888AA',
        'accent-blue': '#4488CC',
        'accent-red': '#FF4444',
        'grid-line': '#555555',
        'floor': '#2C2C2C',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'mono': ['Consolas', 'Monaco', 'monospace'],
      },
      animation: {
        'bounce-scale': 'bounceScale 0.2s ease-out',
      },
      keyframes: {
        bounceScale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
