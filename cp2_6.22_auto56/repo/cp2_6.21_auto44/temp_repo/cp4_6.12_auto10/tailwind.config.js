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
        clay: {
          orange: '#D84315',
        },
        rice: {
          white: '#FFF3E0',
        },
        earth: {
          brown: '#4E342E',
        },
        celadon: {
          green: '#80CBC4',
        },
        status: {
          pending: '#BDBDBD',
          progress: '#42A5F5',
          kiln: '#FF7043',
          done: '#66BB6A',
        },
        glaze: {
          celadon1: '#B2DFDB',
          celadon2: '#80CBC4',
          temmoku1: '#4E342E',
          temmoku2: '#3E2723',
          wu1: '#B0BEC5',
          wu2: '#78909C',
        },
        shelf: {
          empty: '#F5F5F5',
        },
        warn: {
          red: '#FF5252',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(78,52,46,0.08)',
        'card-hover': '0 8px 24px rgba(78,52,46,0.16)',
        nav: '0 1px 3px rgba(78,52,46,0.1)',
      },
      transitionTimingFunction: {
        ease: 'ease',
        'ease-out': 'ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
