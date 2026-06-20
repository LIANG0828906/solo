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
        primary: '#1E3A5F',
        accent: '#C9A84C',
        background: '#FAFAFA',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        card: '8px',
      },
      keyframes: {
        bounceNumber: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        bounceNumber: 'bounceNumber 0.2s ease-in-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        ripple: 'ripple 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
