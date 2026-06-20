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
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          active: '#4338CA',
          disabled: '#A5B4FC',
        },
        surface: '#F8FAFC',
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
        },
        tag: {
          bug: '#EF4444',
          enhance: '#3B82F6',
          doc: '#8B5CF6',
          optimize: '#10B981',
          other: '#64748B',
        },
      },
    },
  },
  plugins: [],
};
