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
        bg: '#1a1a2e',
        panel: '#16213e',
        panelHover: '#1a2a4e',
        accent: '#e94560',
        accentGlow: '#e9456080',
        fg: '#e0e0e0',
        muted: '#8888aa',
        roll: '#2a2a3e',
        grid: '#ffffff20',
        track1: '#ff6b6b',
        track2: '#4ecdc4',
        track3: '#ffe66d',
        track4: '#95e1d3',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
