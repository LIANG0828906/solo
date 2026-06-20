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
          from: '#667eea',
          to: '#764ba2',
        },
        accent: '#48c6ef',
        surface: {
          dark: '#0a0e1a',
          card: 'rgba(15, 20, 40, 0.7)',
          hover: 'rgba(25, 30, 60, 0.8)',
        },
        text: {
          primary: '#e0e0e0',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        priority: {
          low: '#60a5fa',
          medium: '#fbbf24',
          high: '#f97316',
          urgent: '#ef4444',
        },
        milestone: {
          planning: '#6b7280',
          in_progress: '#667eea',
          frozen: '#eab308',
          completed: '#22c55e',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-out-right': 'slideOutRight 0.4s ease-in forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'urgent-blink': 'urgentBlink 1s ease-in-out infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.7' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        urgentBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'bg-gradient': 'linear-gradient(135deg, #0a0e1a 0%, #0f1629 50%, #0a0e1a 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
