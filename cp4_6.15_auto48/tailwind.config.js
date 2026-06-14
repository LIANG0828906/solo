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
        sidebar: '#2D3748',
        'sidebar-hover': '#3D4A5C',
        'main-bg': '#F7FAFC',
        'text-primary': '#4A5568',
        'accent': '#5A67D8',
        'accent-hover': '#4C51BF',
        'accent-light': '#E9E8FC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
