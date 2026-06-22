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
        bgPrimary: '#1A1A2E',
        bgSecondary: '#16213E',
        bgKeyboard: '#0F0F23',
        bgScore: '#2D2D44',
        whiteKey: '#F5F5F5',
        whiteKeyPressed: '#D3D3D3',
        blackKey: '#333333',
        blackKeyPressed: '#555555',
        noteYellow: '#FFE66D',
        accentCyan: '#4ECDC4',
        successGreen: '#6BCB77',
        errorRed: '#FF6B6B',
        tooltipBg: '#1A1A2E',
      },
      boxShadow: {
        'key-glow': '0 0 6px rgba(78, 205, 196, 0.3)',
        'key-glow-hover': '0 0 10px rgba(78, 205, 196, 0.6)',
        'note-glow': '0 0 12px rgba(78, 205, 196, 0.8)',
        'success-glow': '0 0 12px rgba(107, 203, 119, 0.8)',
        'error-glow': '0 0 12px rgba(255, 107, 107, 0.8)',
      },
      animation: {
        'bounce-note': 'bounce-n 0.15s ease',
        'flash-green': 'flash-green 0.3s ease',
        'flash-red': 'flash-red 0.3s ease',
      },
      keyframes: {
        'bounce-n': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'flash-green': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(107, 203, 119, 0.6)' },
        },
        'flash-red': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(255, 107, 107, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
