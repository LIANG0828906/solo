/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0D0D1A',
        'secondary': '#1A1A2E',
        'text-primary': '#E0E0E0',
        'accent-cyan': '#4ECDC4',
        'accent-red': '#FF6B6B',
        'highlight': '#FFD700',
        'glass': 'rgba(255, 255, 255, 0.06)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'sans': ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'cover': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
