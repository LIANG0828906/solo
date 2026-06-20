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
        paper: '#F5F0E8',
        ink: '#2C2C2C',
        accent1: '#FFD6E0',
        accent2: '#D4E6F1',
        accent3: '#D5F5E3',
        accent4: '#E8DAEF',
        accent5: '#FADBD8',
        accent6: '#FEF9E7',
      },
      fontFamily: {
        handwrite: ['"Ma Shan Zheng"', '"ZCOOL KuaiLe"', 'cursive'],
        body: ['"ZCOOL KuaiLe"', '"Ma Shan Zheng"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        flipPage: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '50%': { transform: 'rotateY(-90deg)', opacity: '0.3' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
          '100%': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        flipPage: 'flipPage 0.4s ease-in-out',
        floatUp: 'floatUp 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.5s ease-out',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
