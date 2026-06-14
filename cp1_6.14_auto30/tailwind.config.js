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
        'city-dark': '#1e293b',
        'city-darker': '#0f172a',
        'city-medium': '#334155',
        'city-light': '#64748b',
        'city-bg': '#f8fafc',
        'city-card': '#ffffff',
        'accent': '#f97316',
        'accent-light': '#fdba74',
        'accent-dark': '#ea580c',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -4px rgba(15, 23, 42, 0.12)',
        'card-hover': '0 12px 40px -8px rgba(15, 23, 42, 0.22)',
        'float': '0 8px 32px -8px rgba(30, 41, 59, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      borderRadius: {
        'xl-2': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
