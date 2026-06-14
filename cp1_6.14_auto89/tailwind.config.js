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
        // 主色调：摩卡棕
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
        // 米白色
        cream: {
          50: "#FDFBF7",
          100: "#FAF6F0",
          200: "#F5EFDF",
        },
        // 辅助色：豆沙粉
        blush: {
          50: "#FEF5F3",
          100: "#FCE8E4",
          200: "#F8D4CC",
          300: "#F1B5A8",
          400: "#E78F7A",
          500: "#DB6E55",
          600: "#C7553B",
          700: "#A6442E",
        },
        // 辅助色：雾霾蓝
        dusty: {
          50: "#F3F6F9",
          100: "#E5EBF2",
          200: "#CDD9E5",
          300: "#A8BED1",
          400: "#7D9CB9",
          500: "#5C7FA3",
          600: "#486689",
          700: "#3B526F",
        },
        // 辅助色：鼠尾草绿
        sage: {
          50: "#F3F6F2",
          100: "#E3EBE0",
          200: "#C8D8C3",
          300: "#A3BE9B",
          400: "#7EA073",
          500: "#608554",
          600: "#4B6A42",
          700: "#3D5537",
        },
        // 辅助色：焦糖色
        caramel: {
          50: "#FBF6EE",
          100: "#F5EAD6",
          200: "#ECD3AE",
          300: "#E0B57C",
          400: "#D69652",
          500: "#CD7C34",
          600: "#BF6529",
          700: "#9E4E24",
        },
        // 辅助色：灰紫色
        lavender: {
          50: "#F7F5F9",
          100: "#EFEAF4",
          200: "#DED5E8",
          300: "#C4B4D6",
          400: "#A58EC0",
          500: "#8A6EAA",
          600: "#725790",
          700: "#5D4676",
        },
      },
      fontFamily: {
        // 衬线字体：用于标题和装饰
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        // 无衬线字体：用于正文和交互
        sans: ['"Noto Sans SC"', "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-in-from-bottom": "slideInFromBottom 0.5s ease-out forwards",
        "spin-fade-in": "spinFadeIn 0.8s ease-out forwards",
        "float-up": "floatUp 3s ease-in-out infinite",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInFromBottom: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spinFadeIn: {
          "0%": { opacity: "0", transform: "rotate(-15deg) scale(0.8)" },
          "100%": { opacity: "1", transform: "rotate(0) scale(1)" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
