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
        dungeon: {
          bg: '#1a1a2e',
          panel: '#16213e',
          accent: '#e94560',
          'accent-dim': '#b8354d',
          surface: '#0f3460',
          text: '#eaeaea',
          'text-muted': '#8892a4',
          border: '#2a2a4a',
          shield: '#4fc3f7',
          heal: '#66bb6a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-up': 'floatUp 0.3s ease-out',
        'pulse-hp': 'pulseHp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: 1 },
          '100%': { transform: 'translateY(-8px)', opacity: 0.8 },
        },
        pulseHp: {
          '0%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0.5 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
