/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cream: '#FFF8F0',
        'cream-dark': '#FFE8D0',
        brown: {
          DEFAULT: '#3E2723',
          light: '#5D4037',
          lighter: '#8D6E63',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          dark: '#E05555',
          light: '#FF8A8A',
        },
        'warm-yellow': '#FFD54F',
        'warm-pink': '#FFAB91',
        'warm-white': '#FFF3E0',
        'comment-highlight': '#FFF9C4',
      },
      fontFamily: {
        display: ['Caveat', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        slideDown: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '60px', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        scaleIn: 'scaleIn 0.3s ease-in-out forwards',
        fadeIn: 'fadeIn 0.5s ease-in-out forwards',
        bounce: 'bounce 0.3s ease-in-out',
        slideDown: 'slideDown 0.3s ease-in-out forwards',
        slideUp: 'slideUp 0.3s ease-in-out forwards',
        pulseGlow: 'pulseGlow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
