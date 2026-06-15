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
        'synth-bg': '#1a1a2e',
        'synth-panel': '#16213e',
        'synth-card': '#0f3460',
        'synth-accent': '#e94560',
        'synth-audio': '#00e5ff',
        'synth-control': '#ffd600',
        'synth-trigger': '#ff6d00',
      },
    },
  },
  plugins: [],
};
