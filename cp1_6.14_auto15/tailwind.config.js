/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/client/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        wood: {
          50: '#FBF5EF', 100: '#F3E5D0', 200: '#E7D0A8',
          300: '#D9B97F', 400: '#C99E57', 500: '#B88342',
          600: '#8B5A2B', 700: '#6B4423', 800: '#5D3A1A', 900: '#3E2712'
        },
        forest: {
          50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7',
          300: '#81C784', 400: '#66BB6A', 500: '#4CAF50',
          600: '#43A047', 700: '#2E7D32', 800: '#1B5E20', 900: '#0D3D10'
        }
      },
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['"Source Sans Pro"', 'sans-serif']
      }
    },
  },
  plugins: [],
};
