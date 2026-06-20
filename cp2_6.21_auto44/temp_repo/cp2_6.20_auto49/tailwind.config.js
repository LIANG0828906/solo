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
        garden: {
          warm: '#faf8f5',
          dark: '#1e1e24',
          teal: '#2a9d8f',
          gold: '#e9c46a',
          rose: '#b5838d',
          'tag-blue': '#dbeafe',
          'tag-green': '#dcfce7',
          'tag-purple': '#ede9fe',
          'tag-blue-text': '#2563eb',
          'tag-green-text': '#16a34a',
          'tag-purple-text': '#7c3aed',
        },
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fab-spin': 'fabSpin 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 4px rgba(42,157,143,0.3))' },
          '100%': { filter: 'drop-shadow(0 0 12px rgba(42,157,143,0.6))' },
        },
        fabSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(45deg)' },
        },
      },
    },
  },
  plugins: [],
};
