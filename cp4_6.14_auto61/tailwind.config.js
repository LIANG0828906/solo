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
        debate: {
          bg: {
            primary: "var(--color-bg-primary)",
            secondary: "var(--color-bg-secondary)",
            tertiary: "var(--color-bg-tertiary)",
            warm: "var(--color-bg-warm)",
          },
          primary: "var(--color-primary)",
          positive: "var(--color-positive)",
          negative: "var(--color-negative)",
          accent: "var(--color-accent)",
          neutral: "var(--color-neutral)",
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Helvetica Neue"', "Arial", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', "Consolas", '"Courier New"', "monospace"],
      },
      animation: {
        breathing: "breathing 4s ease-in-out infinite",
        "border-flash": "borderFlash 0.5s ease-in-out 3",
        "border-flash-infinite": "borderFlash 1s ease-in-out infinite",
        "pulse-warning": "pulseWarning 1s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
