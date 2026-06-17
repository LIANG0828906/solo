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
        'navy-900': '#0F172A',
        'navy-800': '#1E293B',
        'navy-700': '#334155',
        'navy-500': '#475569',
        'primary': '#3B82F6',
        'success': '#10B981',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'highlight': '#FEF08A',
      },
    },
  },
  plugins: [],
};
