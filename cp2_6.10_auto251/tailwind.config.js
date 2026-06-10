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
        herb: {
          green: '#3a7d44',
          'green-light': '#4a9d57',
          'green-dark': '#2a5d34',
        },
        paper: {
          white: '#efe6d5',
          'white-dark': '#d9cfbe',
          cream: '#f5f0e6',
        },
        cinnabar: {
          red: '#b33939',
          'red-light': '#d34a4a',
          'red-dark': '#932929',
        },
        ink: {
          black: '#2d2d2d',
          'black-light': '#4a4a4a',
          'black-lighter': '#6a6a6a',
        },
        wood: {
          brown: '#8b6914',
          'brown-light': '#a67c00',
        }
      },
      fontFamily: {
        kai: ['KaiTi', 'STKaiti', 'serif'],
        song: ['SimSun', 'STSong', 'serif'],
      },
      boxShadow: {
        'ink': '2px 2px 8px rgba(45, 45, 45, 0.3)',
        'paper': '0 4px 20px rgba(139, 105, 20, 0.2)',
        'herb': '0 2px 12px rgba(58, 125, 68, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'ink-spread': 'inkSpread 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        inkSpread: {
          '0%': { transform: 'scale(0)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(58, 125, 68, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(58, 125, 68, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
