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
        forest: {
          DEFAULT: '#2d6a4f',
          light: '#40916c',
          dark: '#1b4332',
          50: '#d8f3dc',
        },
        earth: {
          DEFAULT: '#9c6644',
          light: '#b07d62',
          dark: '#7f5539',
        },
        surface: {
          bg: '#f8f9fa',
          card: '#ffffff',
        },
        text: {
          primary: '#212529',
          secondary: '#6c757d',
        },
        warning: {
          bg: '#fff3cd',
          text: '#856404',
        },
        difficulty: {
          easy: '#52b788',
          medium: '#f4a261',
          hard: '#e76f51',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'DM Sans', 'sans-serif'],
        mono: ['DM Sans', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-bottom': 'slideInBottom 0.3s ease-out',
        'slide-out-bottom': 'slideOutBottom 0.3s ease-out',
        'fly-in-right': 'flyInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-highlight': 'pulseHighlight 1s ease-in-out infinite',
        'blink-border': 'blinkBorder 0.8s ease-in-out infinite',
        'scroll-in-right': 'scrollInRight 0.5s ease-in-out',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutBottom: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        flyInRight: {
          '0%': { transform: 'translateX(60px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseHighlight: {
          '0%, 100%': { backgroundColor: 'rgba(231, 111, 81, 0.08)' },
          '50%': { backgroundColor: 'rgba(231, 111, 81, 0.2)' },
        },
        blinkBorder: {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.3)' },
          '50%': { borderColor: 'rgba(59, 130, 246, 1)' },
        },
        scrollInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
