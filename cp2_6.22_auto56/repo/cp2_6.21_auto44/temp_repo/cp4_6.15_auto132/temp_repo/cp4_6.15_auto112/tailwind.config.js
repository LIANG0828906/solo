/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1200px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        neon: {
          blue: '#00d4ff',
          cyan: '#00ffff',
          purple: '#a855f7',
          pink: '#ec4899',
        },
        dark: {
          900: '#1a1a2e',
          800: '#16213e',
          700: '#0f3460',
        }
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'slider-glow': 'sliderGlow 2s ease-in-out infinite',
        'float-breathing': 'floatBreathing 2s ease-in-out infinite',
        'value-pop-in': 'valuePopIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'value-pop-out': 'valuePopOut 0.3s ease-out forwards',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'staggered-fade-in': 'staggeredFadeIn 0.5s ease-out forwards',
        'progress-stripes': 'progressStripes 1s linear infinite',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)',
        'neon-soft': '0 0 10px rgba(0, 212, 255, 0.3), 0 0 20px rgba(0, 212, 255, 0.1)',
      },
      backdropBlur: {
        '2xl': '40px',
      },
    },
  },
  plugins: [],
};
