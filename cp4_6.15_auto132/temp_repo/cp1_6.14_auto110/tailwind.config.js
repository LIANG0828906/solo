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
        'bg-primary': '#1a1a2e',
        'bg-secondary': '#16213e',
        'text-primary': '#e0e0e0',
        'node-selector': '#e94560',
        'node-sequence': '#0f3460',
        'node-condition': '#533483',
        'node-action': '#1a936f',
        'line-active': '#00ff88',
        'line-inactive': '#4a4a6a',
        'highlight': '#ffd700',
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'expand': 'expand 0.5s ease-out',
        'flash': 'flash 0.2s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        expand: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flash: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};
