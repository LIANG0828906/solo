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
        cream: '#F5E6D3',
        'cream-light': '#FFF8EE',
        'cream-dark': '#FDF5E6',
        'coffee-dark': '#3E2723',
        'coffee-mid': '#6B3A2E',
        'coffee-light': '#D4A574',
        syrup: '#A8C0A8',
        foam: '#F0E6D3',
        'season-spring': '#B8D4A5',
        'season-summer': '#FFB07C',
        'season-autumn': '#D4A574',
        'season-winter': '#A8C0D8',
        'tag-red': '#B22222',
        'tag-green': '#2E8B57',
        'btn-preview': '#3B8B3B',
        'btn-preview-hover': '#4CAF50',
        'btn-export': '#555555',
        'btn-export-hover': '#777777',
        'star-gold': '#FFD700',
        'error-red': '#D32F2F',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.08)',
        'card': '0 2px 12px rgba(0,0,0,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'bubble-float': 'bubbleFloat 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bubbleFloat: {
          '0%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-30px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
