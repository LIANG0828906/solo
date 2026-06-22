/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#FDF6F2',
          100: '#FAEBE1',
          200: '#F4D5C3',
          300: '#EBB89C',
          400: '#E09572',
          500: '#D96C4B',
          600: '#C75538',
          700: '#A6442C',
          800: '#863826',
          900: '#6D3022',
        },
        cream: {
          50: '#FDFBF8',
          100: '#FAF6F1',
          200: '#F5EFE6',
          300: '#EDE4D6',
          400: '#D9C9B4',
        },
        caramel: {
          600: '#8B5A3C',
          700: '#6F4630',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 8px 24px -8px rgba(217, 108, 75, 0.35)',
        'card': '0 2px 12px -2px rgba(139, 90, 60, 0.1)',
        'card-hover': '0 12px 32px -8px rgba(217, 108, 75, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
