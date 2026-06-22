/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        patina: '#6b8e23',
        'deep-space': '#1a1a3e',
        gold: '#ffd700',
        'gold-light': '#ffed4a',
        bronze: '#cd7f32',
      },
      fontFamily: {
        song: ['STSong', 'SimSun', 'Songti SC', 'serif'],
      },
      animation: {
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        goldPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
