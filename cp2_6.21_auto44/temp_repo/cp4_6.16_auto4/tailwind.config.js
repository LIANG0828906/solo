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
        navy: {
          DEFAULT: '#2c3e50',
          50: '#f0f3f5',
          100: '#d9e0e5',
          200: '#b3c1cb',
          300: '#8da2b1',
          400: '#678397',
          500: '#4a6a80',
          600: '#3a5568',
          700: '#2c3e50',
          800: '#1f2d3a',
          900: '#131d26',
        },
        emerald: {
          DEFAULT: '#27ae60',
          50: '#eafaf0',
          100: '#d5f5e0',
          200: '#abebc6',
          300: '#82e0ac',
          400: '#58d68d',
          500: '#27ae60',
          600: '#1e8449',
          700: '#196f3d',
          800: '#145a32',
          900: '#0e4527',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
