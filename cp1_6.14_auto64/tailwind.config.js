/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        mood: {
          happy: {
            from: '#F97316',
            to: '#EC4899',
          },
          sad: {
            from: '#6366F1',
            to: '#A855F7',
          },
          romantic: {
            from: '#EC4899',
            to: '#F472B6',
          },
          passionate: {
            from: '#EF4444',
            to: '#F97316',
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'typewriter': 'typewriter 0.5s steps(1) forwards',
        'fly-heart': 'fly-heart 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'sparkle': 'sparkle 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', filter: 'blur(8px)' },
          '50%': { opacity: '1', filter: 'blur(12px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fly-heart': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5) translateY(-40px)', opacity: '0.8' },
          '100%': { transform: 'scale(0.3) translateY(-120px) translateX(80px)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'sparkle': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
