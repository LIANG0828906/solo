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
        arena: {
          bg: "#1e1e2e",
          card: "#2b2b3d",
          accent: "#89b4fa",
          accentHover: "#74c7ec",
          text: "#cdd6f4",
          textMuted: "#a6adc8",
          border: "#45475a",
          success: "#a6e3a1",
          warning: "#f9e2af",
          danger: "#f38ba8",
        },
      },
      animation: {
        "pulse-fast": "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-score": "bounceScore 0.3s ease-out",
        "flash-red": "flashRed 1s ease-in-out infinite",
      },
      keyframes: {
        bounceScore: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        flashRed: {
          "0%, 100%": { color: "#f38ba8" },
          "50%": { color: "#f9e2af" },
        },
      },
    },
  },
  plugins: [],
};
