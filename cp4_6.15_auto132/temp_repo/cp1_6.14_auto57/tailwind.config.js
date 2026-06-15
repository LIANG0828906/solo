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
        'bg-main': '#1a1a2e',
        'bg-card': '#16213e',
        'accent': '#0f3460',
        'accent-2': '#1a4b82',
        'btn': '#e94560',
        'btn-hover': '#ff5c78',
        'text-main': '#e0e0e0',
        'text-dim': '#9ca3af',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Noto Sans SC"', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(233,69,96,0.3), 0 0 24px rgba(233,69,96,0.25)',
        'glow-blue': '0 0 0 1px rgba(77,166,255,0.4), 0 0 28px rgba(77,166,255,0.25)',
        'card': '0 8px 32px rgba(0,0,0,0.4)',
      },
      keyframes: {
        pulse-bpm: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.6' },
        },
        blink-save: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.9' },
        },
        float-in: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'pulse-bpm': 'pulse-bpm var(--bpm-dur, 500ms) ease-in-out infinite',
        'blink-save': 'blink-save 0.6s ease-in-out infinite',
        'float-in': 'float-in 0.4s ease-out both',
        'wave': 'wave 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
