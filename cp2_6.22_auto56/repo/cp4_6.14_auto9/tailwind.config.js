/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#f0f2f5',
        'board-bg': '#ffffff',
        'high-priority': '#ef4444',
        'medium-priority': '#f59e0b',
        'low-priority': '#10b981'
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.1)',
        'card-hover': '0 8px 16px rgba(0,0,0,0.15)'
      },
      borderRadius: {
        'card': '8px'
      },
      keyframes: {
        'elastic-bounce': {
          '0%': { transform: 'scale(0.95)', opacity: '0.5' },
          '50%': { transform: 'scale(1.02)', opacity: '0.8' },
          '70%': { transform: 'scale(0.99)', opacity: '0.95' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        'elastic-bounce': 'elastic-bounce 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
      }
    },
  },
  plugins: [],
}
