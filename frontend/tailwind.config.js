import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: colors.slate,
        primary: colors.indigo,
        accent: colors.emerald,
      }
    },
  },
  plugins: [],
}