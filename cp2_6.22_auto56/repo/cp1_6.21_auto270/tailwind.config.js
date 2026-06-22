/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E293B',
          light: '#334155',
        },
        accent: {
          blue: '#3B82F6',
          green: '#10B981',
          green2: '#34D399',
          red: '#EF4444',
        },
        bg: {
          start: '#F0F4F8',
          end: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        toolbar: '0 4px 20px rgba(0,0,0,0.3)',
        card: '0 2px 12px rgba(0,0,0,0.08)',
        cardHover: '0 8px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        '2xl-plus': '24px',
      },
    },
  },
  plugins: [],
}
