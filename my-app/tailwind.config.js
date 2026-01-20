/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background-main": "#121212",
        "background-surface": "#181818",
        "background-elevated": "#282828",
        "background-pressed": "#333333",

        "text-high": "#FFFFFF",
        "text-medium": "#B3B3B3",
        "text-low": "#6A6A6A",

        "icon-main": "#FFFFFF",
        "icon-secondary": "#B3B3B3",
        "icon-disabled": "#535353",

        "action-primary": "#1DB954",
        "action-primary-hover": "#1ED760",
        "action-secondary": "#7A3EFF",
        "action-secondary-hover": "#8F5FFF",
        "action-danger": "#E91429",
        "action-success": "#1AA34A",

        "border-light": "#282828",
        "border-focus": "#1DB954",
        "border-error": "#E91429",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(90deg, #1DB954 0%, #7A3EFF 100%)",
        "gradient-break": "linear-gradient(90deg, #7A3EFF 0%, #3E2EFF 100%)",
      },
    },
  },
  plugins: [],
};