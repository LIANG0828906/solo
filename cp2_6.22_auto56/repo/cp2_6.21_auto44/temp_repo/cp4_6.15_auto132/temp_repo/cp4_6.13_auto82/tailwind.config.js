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
        'bg-cream': '#FAF0E6',
        'header-brown': '#4A2E1B',
        'btn-amber': '#FFBF00',
        'btn-amber-hover': '#E69500',
        'grid-gray': '#D3D3D3',
        'stall-food': '#FF8C42',
        'stall-handmade': '#4B61D1',
        'stall-secondhand': '#6BAA4F',
        'stall-cultural': '#D94F8B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lato"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.15)',
      },
      animation: {
        'breathing': 'breathing 0.2s ease-in-out infinite',
        'flash': 'flash 0.2s ease-in-out 2',
        'spin-slow': 'spin 0.4s ease-in-out',
        'float-up': 'floatUp 0.3s ease-out',
      },
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        floatUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
