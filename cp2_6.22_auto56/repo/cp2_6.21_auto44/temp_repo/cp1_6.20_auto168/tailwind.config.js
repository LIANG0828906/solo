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
        'app-bg': '#1a1a2e',
        'app-panel': '#16213e',
        'app-primary': '#0f3460',
        'app-accent': '#e94560',
        'app-surface': '#1c2541',
        'app-border': '#2a3a5c',
        'app-text': '#e0e0e0',
        'app-text-dim': '#8892a8',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
