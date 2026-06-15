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
        court: {
          brown: '#5D4037',
          brownLight: '#8D6E63',
          brownDark: '#3E2723',
          green: '#7CB342',
          greenLight: '#AED581',
          greenDark: '#558B2F',
          cream: '#FFF8E1',
          wood: '#D7CCC8',
          pin: '#E53935',
        }
      },
      fontFamily: {
        display: ['"Oswald"', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pin-drop': 'pinDrop 0.5s ease-out',
        'shake': 'shake 0.3s ease-in-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3) translateY(-20px)', opacity: '0' },
          '50%': { transform: 'scale(1.05) translateY(0)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        pinDrop: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '60%': { transform: 'translateY(5px)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
