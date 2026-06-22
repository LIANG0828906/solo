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
        editor: {
          dark: '#1a1b26',
          light: '#f5f5f0',
        },
        surface: {
          dark: '#24283b',
          light: '#ffffff',
        },
        border: {
          dark: '#3b4261',
          light: '#d5d5d0',
        },
        accent: '#7aa2f7',
        success: '#9ece6a',
        danger: '#f7768e',
        warning: '#e0af68',
        text: {
          dark: '#a9b1d6',
          light: '#343b44',
        },
        muted: {
          dark: '#565f89',
          light: '#8b919a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'slide-in-right': 'slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
