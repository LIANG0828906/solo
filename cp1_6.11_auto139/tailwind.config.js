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
        primary: '#2196F3',
        'primary-dark': '#1976D2',
        'primary-light': '#E3F2FD',
        'primary-deeper': '#1565C0',
        'tech': '#4CAF50',
        'design': '#FF9800',
        'mgmt': '#2196F3',
        'bg-main': '#F0F4F8',
        'card-bg': '#FFFFFF',
        'border-main': '#E0E0E0',
        'axis': '#D0D0D0',
        'title': '#212121',
        'body': '#424242',
        'aux': '#757575',
        'danger': '#D32F2F',
        'pinned-bg': '#FFFDE7',
      },
      borderRadius: {
        'md': '8px',
        'lg': '12px',
        'pill': '20px',
      },
      boxShadow: {
        'low': '0 2px 4px rgba(0,0,0,0.08)',
        'mid': '0 4px 16px rgba(0,0,0,0.1)',
        'high': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
