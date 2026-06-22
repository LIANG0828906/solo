/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E86AB',
          light: '#4A9FC5',
          dark: '#1D6A8A',
        },
        secondary: {
          DEFAULT: '#A3D9B1',
          light: '#C4E8CF',
          dark: '#7BC48D',
        },
        accent: {
          DEFAULT: '#F18F01',
          light: '#F5A833',
          dark: '#D07800',
        },
        category: {
          tech: '#2E86AB',
          design: '#8B5CF6',
          operation: '#10B981',
          other: '#6B7280',
        },
        priority: {
          p0: '#EF4444',
          p1: '#F97316',
          p2: '#2E86AB',
          p3: '#9CA3AF',
        },
      },
      borderRadius: {
        xl: '12px',
      },
      transitionDuration: {
        '200': '200ms',
      },
      keyframes: {
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        breathe: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-down': 'slideInDown 0.6s ease-out',
        'heartbeat': 'heartbeat 0.3s ease-in-out',
        'breathe': 'breathe 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
