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
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#e94560',
        'accent-deep': '#0f3460',
        surface: '#0f0f23',
        'surface-light': '#1f2940',
        'text-primary': '#e8e8e8',
        'text-secondary': '#a0a0b8',
        'text-muted': '#6b6b80',
        'priority-high': '#e94560',
        'priority-medium': '#f59e0b',
        'priority-low': '#22c55e',
        'status-todo': '#6366f1',
        'status-progress': '#f59e0b',
        'status-done': '#22c55e',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 300ms ease-out',
        'bounce-in': 'bounceIn 300ms ease-out',
        'scale-up': 'scaleUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
};
