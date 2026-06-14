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
        mocha: {
          50: "#FAF6F0",
          100: "#F3EDE2",
          200: "#E8DCC8",
          300: "#D8C4A5",
          400: "#C4A87D",
          500: "#AF8D5C",
          600: "#8B6F47",
          700: "#6E5738",
          800: "#503F29",
          900: "#33281B",
        },
        cream: {
          50: "#FDFBF7",
          100: "#FAF6F0",
          200: "#F5EFDF",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "rotate-fade": "rotateFade 0.8s ease-out forwards",
        "bounce-in": "bounceIn 0.4s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
        ripple: "ripple 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rotateFade: {
          "0%": { opacity: "0", transform: "rotate(-10deg) scale(0.8)" },
          "100%": { opacity: "1", transform: "rotate(0) scale(1)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
