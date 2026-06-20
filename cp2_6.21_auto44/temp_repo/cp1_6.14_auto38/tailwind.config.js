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
        primary: {
          50: '#FFF5E6',
          100: '#FFE8CC',
          200: '#FFD199',
          300: '#FFBA66',
          400: '#FFA333',
          500: '#FF8C42',
          600: '#E67329',
          700: '#CC5A1F',
          800: '#B34714',
          900: '#99380D',
        },
        cream: '#FFF5E6',
        warmGray: {
          50: '#FAF7F2',
          100: '#F2EDE4',
          200: '#E5DDCE',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-soft': 'bounce-soft 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'bounce-soft': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
