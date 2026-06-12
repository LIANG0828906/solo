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
        'app-card': '#16213e',
        'app-text': '#e0e0e0',
        'app-btn-from': '#0f3460',
        'app-btn-to': '#533483',
        'track-drums': '#e74c3c',
        'track-bass': '#3498db',
        'track-guitar': '#2ecc71',
        'track-vocals': '#9b59b6',
      },
    },
  },
  plugins: [],
}
