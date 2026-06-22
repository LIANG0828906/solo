/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0F172A',
        'panel-bg': '#1E293B',
        'border-primary': '#334155',
        'border-secondary': '#475569',
        'accent': '#3B82F6',
        'accent-hover': '#2563EB',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'selection': '#FEF08A',
      },
      fontFamily: {
        'code': ['Fira Code', 'monospace'],
      },
      fontSize: {
        'code': '16px',
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(15, 23, 42, 0.5), 0 2px 4px -2px rgba(15, 23, 42, 0.5)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
      transitionTimingFunction: {
        'palette': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'spin-slow': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
