/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-main': '#1a1a2e',
        'bg-card': '#16213e',
        'accent': '#0f3460',
        'highlight': '#e94560',
        'text-main': '#eaeaea',
        'text-secondary': '#a0a0b0'
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0,0,0,0.3)'
      },
      animation: {
        'flow-dash': 'flowDash 1s linear infinite',
        'scale-pop': 'scalePop 0.3s ease-out'
      },
      keyframes: {
        flowDash: {
          '0%': { 'stroke-dashoffset': '0' },
          '100%': { 'stroke-dashoffset': '10' }
        },
        scalePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: []
};
