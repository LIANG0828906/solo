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
        pomodoro: {
          work: '#3b82f6',
          study: '#22c55e',
          exercise: '#f97316',
        },
      },
    },
  },
  plugins: [],
};
