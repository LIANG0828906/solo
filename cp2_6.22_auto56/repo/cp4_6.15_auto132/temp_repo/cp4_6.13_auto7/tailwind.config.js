/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFB347',
          light: '#FFCC80',
          dark: '#FF9800',
        },
        secondary: {
          DEFAULT: '#FF8A80',
          light: '#FFAB91',
          dark: '#FF7043',
        },
        warm: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.18s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
        'pop': 'pop 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '60%': { transform: 'translateY(4px)', opacity: '1' },
          '100%': { transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
