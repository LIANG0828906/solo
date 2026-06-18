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
        paper: '#F5E6CA',
        wood: '#5D4037',
        rust: '#C0392B',
        skin: '#FDDCB5',
        upload: '#F9F6F0',
        swatch: {
          1: '#F4A460',
          2: '#8B4513',
          3: '#222222',
          4: '#F5F5DC',
          5: '#CD853F',
          6: '#A0522D',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0,0,0,0.08)',
        'soft-hover': '0 6px 16px rgba(0,0,0,0.12)',
      },
      transitionTimingFunction: {
        'snap': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }
    },
  },
  plugins: [],
};
