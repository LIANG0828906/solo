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
        paper: "#F5E6C8",
        "vintage-red": "#8B4513",
        ink: "#333333",
        gold: "#FFD700",
        cream: "#FFF8E7",
        sepia: "#D4B896",
        parchment: "#F0E6D2",
        bronze: "#CD7F32",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', '"Segoe UI"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
        typewriter: ['"Courier Prime"', '"Special Elite"', '"Courier New"', "monospace"],
        handwriting: ['"Dancing Script"', '"Pacifico"', "cursive"],
      },
      boxShadow: {
        "paper-shadow":
          "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24), inset 0 0 40px rgba(139,69,19,0.05)",
        "paper-shadow-lg":
          "0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1), inset 0 0 60px rgba(139,69,19,0.08)",
        "gold-glow":
          "0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.2)",
        "vintage-shadow":
          "2px 2px 8px rgba(139,69,19,0.2), inset 0 0 20px rgba(139,69,19,0.03)",
      },
    },
  },
  plugins: [],
};
