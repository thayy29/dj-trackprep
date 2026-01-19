/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: "#0E0E11",
        surface: "#16161D",

        text: {
          main: "#F5F5F7",
          muted: "#A1A1AA",
        },

        brand: {
          primary: "#7C3AED",
          secondary: "#22D3EE",
        },
      },
    },
  },
  plugins: [],
}
