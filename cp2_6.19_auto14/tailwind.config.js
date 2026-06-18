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
        synth: {
          bg: '#0f0f1b',
          primary: '#7c3aed',
          highlight: '#22d3ee',
          warm1: '#ff6b6b',
          warm2: '#feca57',
          surface: '#1a1a2e',
          border: '#2a2a4a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'breathe': 'breathe 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spring-in': 'springIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'btn-press': 'btnPress 0.2s ease',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { borderColor: '#ff6b6b' },
          '50%': { borderColor: '#feca57' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        springIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        btnPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 15px rgba(124, 58, 237, 0.5), 0 0 30px rgba(124, 58, 237, 0.2)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.5), 0 0 30px rgba(34, 211, 238, 0.2)',
        'glow-warm': '0 0 15px rgba(255, 107, 107, 0.5), 0 0 30px rgba(254, 202, 87, 0.2)',
        'float': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
