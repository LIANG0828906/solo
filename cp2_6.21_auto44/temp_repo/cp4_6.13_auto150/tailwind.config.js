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
        dark: {
          bg: '#1a1a2e',
          card: '#16213e',
          accent1: '#0f3460',
          accent2: '#e94560',
          text: '#eeeeee',
        },
        light: {
          bg: '#fafafa',
          card: '#ffffff',
          accent1: '#667eea',
          accent2: '#764ba2',
          text: '#333333',
        },
        score: {
          low: '#e74c3c',
          mid: '#f1c40f',
          high: '#2ecc71',
        },
        sentiment: {
          positive: '#2ecc71',
          neutral: '#f39c12',
          negative: '#e74c3c',
        },
        radar: {
          fill: '#3498db80',
        },
        gradient: {
          start: '#667eea',
          end: '#764ba2',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'pulse-scale': 'pulseScale 0.2s ease-in-out',
        'float': 'float 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseScale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
          '100%': { transform: 'translateY(-4px)', boxShadow: '0 10px 12px rgba(0,0,0,0.15)' },
        },
      },
      transitionProperty: {
        'theme': 'background-color, color, border-color',
      },
    },
  },
  plugins: [],
};