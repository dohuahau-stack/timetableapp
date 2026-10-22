/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#EAF6F7",
          100: "#D0EBEE",
          200: "#A6D8DE",
          300: "#6DBBC5",
          400: "#3A9FAE",
          500: "#1D8A99",
          600: "#157483",
          700: "#125E6B",
          800: "#104B56",
        },
      },
      keyframes: {
        "dialog-in": {
          from: { opacity: "0", transform: "translate(-50%, -47%) scale(0.97)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-out": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
        },
        "overlay-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-out": { from: { opacity: "1" }, to: { opacity: "0" } },
      },
      animation: {
        "dialog-in": "dialog-in 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        "dialog-out": "dialog-out 160ms ease-in forwards",
        "overlay-in": "overlay-in 200ms ease-out",
        "overlay-out": "overlay-out 160ms ease-in forwards",
      },
    },
  },
  plugins: [],
};
