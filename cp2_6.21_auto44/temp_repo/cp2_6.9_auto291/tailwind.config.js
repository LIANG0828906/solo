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
        'wood-deep': '#3e2723',
        'wood-light': '#8d6e63',
        'wood-medium': '#5D4037',
        'paper': '#F5DEB3',
        'paper-dark': '#E8D4A0',
        'gold': '#FFD700',
        'gold-dark': '#FF8C00',
        'cart-single': '#8B4513',
        'cart-double': '#A0522D',
        'node-bg': '#F5F5DC',
        'route-color': '#4E342E',
        'bandit-red': '#B71C1C',
      },
      fontFamily: {
        'chinese-title': ['"Ma Shan Zheng"', 'cursive'],
        'chinese-body': ['"Noto Serif SC"', 'serif'],
      },
      borderRadius: {
        'ancient': '12px',
      },
      animation: {
        'lantern-swing': 'lanternSwing 3s ease-in-out infinite',
        'card-float': 'cardFloat 0.3s ease-out forwards',
        'avatar-shake': 'avatarShake 0.3s ease-in-out',
        'bandit-flash': 'banditFlash 0.8s ease-in-out infinite',
        'sword-slash': 'swordSlash 1s ease-in-out',
        'cart-bounce': 'cartBounce 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        lanternSwing: {
          '0%, 100%': { transform: 'rotate(-5deg) translateX(-10px)' },
          '50%': { transform: 'rotate(5deg) translateX(10px)' },
        },
        cardFloat: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(93, 64, 55, 0.3)' },
          '100%': { transform: 'translateY(-10px)', boxShadow: '0 12px 24px rgba(93, 64, 55, 0.5)' },
        },
        avatarShake: {
          '0%, 100%': { transform: 'scale(1.1) rotate(0deg)' },
          '25%': { transform: 'scale(1.1) rotate(-3deg)' },
          '75%': { transform: 'scale(1.1) rotate(3deg)' },
        },
        banditFlash: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        swordSlash: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-45deg)' },
          '50%': { transform: 'rotate(90deg)' },
          '75%': { transform: 'rotate(-15deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        cartBounce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(0.85)' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
