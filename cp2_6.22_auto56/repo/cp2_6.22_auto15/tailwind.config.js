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
        'kanban-primary': '#2c3e50',
        'kanban-accent': '#3498db',
        'kanban-accent-dark': '#2980b9',
        'kanban-bg': '#f5f6fa',
        'kanban-border': '#e0e0e0',
        'kanban-priority-high': '#e74c3c',
        'kanban-priority-medium': '#f39c12',
        'kanban-priority-low': '#27ae60',
      },
    },
  },
  plugins: [],
};
