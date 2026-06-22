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
        bg: '#1e1e2e',
        'bg-card': '#2b2b3d',
        'bg-hover': '#363650',
        'text-primary': '#cdd6f4',
        'text-secondary': '#a6adc8',
        accent: '#89b4fa',
        'accent-hover': '#74c7ec',
        success: '#a6e3a1',
        error: '#f38ba8',
        warning: '#fab387',
        'difficulty-easy': '#a6e3a1',
        'difficulty-medium': '#fab387',
        'difficulty-hard': '#f38ba8',
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
        sans: ['JetBrains Mono', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'content': '12px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'stagger-1': 'fadeIn 0.3s ease-out 0.05s both',
        'stagger-2': 'fadeIn 0.3s ease-out 0.1s both',
        'stagger-3': 'fadeIn 0.3s ease-out 0.15s both',
        'stagger-4': 'fadeIn 0.3s ease-out 0.2s both',
        'stagger-5': 'fadeIn 0.3s ease-out 0.25s both',
        'stagger-6': 'fadeIn 0.3s ease-out 0.3s both',
        'stagger-7': 'fadeIn 0.3s ease-out 0.35s both',
        'stagger-8': 'fadeIn 0.3s ease-out 0.4s both',
        'stagger-9': 'fadeIn 0.3s ease-out 0.45s both',
        'stagger-10': 'fadeIn 0.3s ease-out 0.5s both',
        'achievement-unlock': 'achievementUnlock 0.8s ease-out',
        'glow-spin': 'glowSpin 3s linear infinite',
        'dot-pulse': 'dotPulse 0.5s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        achievementUnlock: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.3) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
        glowSpin: {
          '0%': { boxShadow: '0 0 10px rgba(137,180,250,0.3), 0 0 20px rgba(137,180,250,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(137,180,250,0.6), 0 0 40px rgba(137,180,250,0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(137,180,250,0.3), 0 0 20px rgba(137,180,250,0.1)' },
        },
        dotPulse: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
