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
        green: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        orange: {
          DEFAULT: '#F97316',
        },
        red: {
          DEFAULT: '#EF4444',
        },
        warm: {
          DEFAULT: '#FEFCF3',
        },
        gray: {
          100: '#F3F4F6',
          200: '#FFF7ED',
          300: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
};
