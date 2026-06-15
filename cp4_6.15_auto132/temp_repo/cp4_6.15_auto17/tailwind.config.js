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
        forge: {
          bg: '#1a1a2e',
          card: '#16213e',
          accent: '#e94560',
          'accent-hover': '#ff6b81',
          surface: '#0f3460',
          border: '#1a3a5c',
          muted: '#8892b0',
          text: '#e6e6e6',
        },
        category: {
          text: '#8be9fd',
          image: '#ffb86c',
          music: '#bd93f9',
          video: '#50fa7b',
          other: '#f1fa8c',
        },
        log: {
          completed: '#50fa7b',
          progress: '#8be9fd',
          blocked: '#ff5555',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'float-up': 'floatUp 0.4s ease-out forwards',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
