/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/client/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'space-bg': '#0a0a2e',
        'space-dark': '#05051a',
        'cyber-blue': '#00d4ff',
        'cyber-red': '#ff6b6b',
        'cyber-green': '#00ff88',
        'cyber-yellow': '#ffd93d',
        'cyber-purple': '#a855f7'
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif']
      },
      boxShadow: {
        'neon-blue': '0 0 10px #00d4ff, 0 0 20px #00d4ff40, 0 0 40px #00d4ff20',
        'neon-red': '0 0 10px #ff6b6b, 0 0 20px #ff6b6b40, 0 0 40px #ff6b6b20',
        'neon-green': '0 0 10px #00ff88, 0 0 20px #00ff8840, 0 0 40px #00ff8820'
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%': { textShadow: '0 0 5px #00d4ff, 0 0 10px #00d4ff' },
          '100%': { textShadow: '0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #00d4ff' }
        }
      }
    },
  },
  plugins: [],
}
