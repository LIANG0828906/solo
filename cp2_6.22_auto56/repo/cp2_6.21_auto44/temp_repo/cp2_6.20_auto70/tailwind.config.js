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
        leather: {
          brown: '#8b5e3c',
          beige: '#d2b48c',
        },
        panel: {
          bg: '#2a2a2a',
          dark: '#1a1a1a',
          card: '#3a3a3a',
          hover: '#4a4a4a',
        },
        accent: {
          green: '#00ff88',
          teal: '#00aa88',
          tealHover: '#00ccaa',
        },
        danger: {
          red: '#ff4444',
          orange: '#ff8844',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'pulse-border': 'pulseBorder 0.5s ease-in-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseBorder: {
          '0%, 100%': { borderColor: 'rgba(255, 68, 68, 0.3)' },
          '50%': { borderColor: 'rgba(255, 68, 68, 1)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
