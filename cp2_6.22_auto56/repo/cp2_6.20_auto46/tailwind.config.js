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
        lab: {
          bg: '#e8eef5',
          navy: '#1b2b4c',
          cobalt: '#3a6ea5',
          cobaltLight: '#5b8fc9',
          text: '#1e2a38',
          surface: '#f0f2f5',
          muted: '#d0d8e0',
          border: '#c8d0d8',
        },
      },
      borderRadius: {
        lab: '8px',
      },
      transitionDuration: {
        lab: '200ms',
      },
    },
  },
  plugins: [],
};
