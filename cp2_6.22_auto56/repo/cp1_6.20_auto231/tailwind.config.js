/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a192f",
          secondary: "#112240",
          tertiary: "#020c1b",
          panel: "#152238",
        },
        accent: {
          cyan: "#00bcd4",
          teal: "#64ffda",
          indigo: "#3f51b5",
        },
        light: {
          purple: "#4a148c",
          yellow: "#ffee58",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"Roboto Mono"', "Consolas", "monospace"],
      },
      borderRadius: {
        card: "8px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 188, 212, 0.3)",
        "glow-lg": "0 0 40px rgba(100, 255, 218, 0.25)",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
