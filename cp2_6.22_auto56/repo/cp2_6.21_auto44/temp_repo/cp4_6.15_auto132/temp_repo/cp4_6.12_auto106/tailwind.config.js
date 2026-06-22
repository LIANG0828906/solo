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
        warm: {
          orange: "#ff7043",
          orangeHover: "#f4511e",
          cream: "#fdf5e6",
          brown: "#3e2723",
          yellow: "#fff8e1",
          avatar: "#ffe0b2",
        },
        diff: {
          easy: "#81c784",
          medium: "#ffb74d",
          hard: "#e57373",
        },
        like: {
          red: "#ff1744",
          gray: "#bdbdbd",
        },
      },
    },
  },
  plugins: [],
};
