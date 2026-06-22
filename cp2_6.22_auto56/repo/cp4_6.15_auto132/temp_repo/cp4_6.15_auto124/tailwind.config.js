/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF6F0',
          200: '#F3EADB',
        },
        tan: {
          300: '#E5C9A0',
          400: '#D4A574',
          500: '#C28A50',
        },
        brown: {
          600: '#8B6240',
          700: '#6D4C2F',
          800: '#5D4037',
          900: '#3E2A20',
        },
        accent: {
          400: '#FFA86B',
          500: '#FF8C42',
          600: '#E8742A',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'count-up': 'countUp 1.2s ease-out forwards',
        'pulse-orange': 'pulseOrange 1.5s ease-in-out infinite',
        'bounce-once': 'bounceOnce 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow': 'glow 1.2s ease-out forwards',
        'particle': 'particle 1s ease-out forwards',
        'highlight-fade': 'highlightFade 1.5s ease-out forwards',
      },
      keyframes: {
        countUp: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,140,66,0.6)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,140,66,0)' }
        },
        bounceOnce: {
          '0%, 100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.25)' },
          '60%': { transform: 'scale(0.95)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        glow: {
          '0%': { transform: 'scale(0.4)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        particle: {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '100%': { opacity: '0' }
        },
        highlightFade: {
          '0%': { backgroundColor: 'rgba(255,140,66,0.3)' },
          '100%': { backgroundColor: 'transparent' }
        }
      }
    },
  },
  plugins: [],
}
