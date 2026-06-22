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
        card: '#16213e',
        accent: '#e94560',
        'accent-hover': '#ff6b81',
        'card-hover': '#1a2744',
        'deep-blue': '#0a1128',
        violet: '#7b2ff7',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
