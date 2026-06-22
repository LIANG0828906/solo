/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'scene-bg': '#1E1E1E',
        'panel-bg': '#FAFAFA',
        'panel-border': '#E0E0E0',
        'carbon': '#808080',
        'nitrogen': '#0000FF',
        'oxygen': '#FF0000',
        'sulfur': '#FFFF00',
        'bond-white': '#FFFFFF',
        'input-bar': '#2196F3',
        'score-bar': '#4CAF50',
        'snapshot-bar': '#FF9800',
        'conflict-red': '#D32F2F',
        'score-green': '#388E3C',
        'menu-bg': '#0D47A1',
        'btn-primary-start': '#43A047',
        'btn-primary-end': '#66BB6A',
        'btn-snapshot': '#FB8C00',
        'btn-snapshot-hover': '#FFA726',
      },
      animation: {
        'pulse-color': 'pulseColor 1.5s ease-in-out infinite',
        'conflict-flash': 'conflictFlash 0.5s ease-in-out infinite',
        'btn-press': 'btnPress 0.1s ease-out',
        'float-up': 'floatUp 0.2s ease-out',
      },
      keyframes: {
        pulseColor: {
          '0%, 100%': { backgroundColor: '#2196F3' },
          '50%': { backgroundColor: '#42A5F5' },
        },
        conflictFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        btnPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
        },
      },
    },
  },
  plugins: [],
}
