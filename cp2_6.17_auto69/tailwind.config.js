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
        'panel-bg': '#1A1A2E',
        'diagnostic-bg': '#0D1117',
        'log-bg': '#0A0E15',
        'cyan': '#00E5FF',
        'green': '#00FF88',
        'pink': '#FF3366',
        'log-text': '#88CCFF',
      },
      fontFamily: {
        'consolas': ['Consolas', 'monospace'],
      },
      animation: {
        'border-pulse': 'borderPulse 2s ease-in-out infinite',
      },
      keyframes: {
        borderPulse: {
          '0%, 100%': { borderColor: '#00E5FF' },
          '50%': { borderColor: '#00FF88' },
        },
      },
    },
  },
  plugins: [],
};
