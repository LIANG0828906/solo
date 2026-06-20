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
        nebula: {
          bg: "#0a0a1a",
          surface: "#12122a",
          card: "#1a1a3e",
          border: "#2a2a5a",
        },
        element: {
          fire: "#ff4d2e",
          water: "#2e9bff",
          wind: "#7ee8fa",
          earth: "#c8a24e",
          light: "#ffe066",
          dark: "#8b5cf6",
        },
        rarity: {
          common: "#9ca3af",
          uncommon: "#22c55e",
          rare: "#3b82f6",
          epic: "#a855f7",
          legendary: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Quicksand", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.005)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        lightBeam: {
          "0%": { height: "0%", opacity: "0" },
          "30%": { height: "100%", opacity: "1" },
          "100%": { height: "100%", opacity: "0.3" },
        },
        buttonExpand: {
          "0%": { scaleX: "0", opacity: "0" },
          "100%": { scaleX: "1", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slotFlash: {
          "0%": { borderColor: "var(--flash-color)", opacity: "1" },
          "100%": { borderColor: "transparent", opacity: "0" },
        },
      },
      animation: {
        breathe: "breathe 3s ease-in-out infinite",
        glowPulse: "glowPulse 1.5s ease-in-out infinite",
        lightBeam: "lightBeam 800ms ease-out forwards",
        buttonExpand: "buttonExpand 400ms ease-out forwards",
        fadeIn: "fadeIn 300ms ease-out forwards",
        slotFlash: "slotFlash 500ms ease-out forwards",
      },
    },
  },
  plugins: [],
};
