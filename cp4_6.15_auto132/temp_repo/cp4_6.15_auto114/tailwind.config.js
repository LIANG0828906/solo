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
        'editor-bg': '#2b2b2b',
        'editor-panel': '#1f1f1f',
        'editor-border': '#374151',
        'accent-green': '#00ff88',
        'accent-yellow': '#ffdd00',
        'accent-purple': '#a855f7',
        'accent-blue': '#3b82f6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 136, 0.5)',
        'glow-yellow': '0 0 10px rgba(255, 221, 0, 0.5)',
        'glow-purple': '0 0 10px rgba(168, 85, 247, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
