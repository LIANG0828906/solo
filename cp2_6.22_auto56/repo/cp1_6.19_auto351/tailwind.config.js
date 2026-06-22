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
        wasteland: {
          bg: '#1a1a1a',
          primary: '#ffb74d',
          accent: '#ff7043',
          success: '#4caf50',
          surface: '#2c2c2c',
          border: '#424242',
        },
      },
    },
  },
  plugins: [],
};
