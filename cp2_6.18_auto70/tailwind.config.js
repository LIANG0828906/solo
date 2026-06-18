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
        'bg-main': '#111827',
        'bg-card': '#1F2937',
        'bg-sidebar': '#0F172A',
        'accent': '#F59E0B',
        'success': '#10B981',
        'danger': '#EF4444',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'old-version': '#3B82F6',
        'new-version': '#F97316',
        'timeline': '#4B5563',
      },
    },
  },
  plugins: [],
};
