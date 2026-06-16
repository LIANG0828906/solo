import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'comic-bg': '#FFF8E7',
        'comic-primary': '#4A2C2A',
        'comic-primary-hover': '#6B3A3A',
        'comic-accent': '#E63946',
        'comic-panel': '#F0F0F0',
      },
      fontFamily: {
        bangers: ['Bangers', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-out-left': 'slideOutLeft 0.3s ease-in forwards',
        'zoom-in': 'zoomIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
});
