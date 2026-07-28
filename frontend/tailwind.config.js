/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dce4ff',
          300: '#c2d0ff',
          400: '#9cb0ff',
          500: '#6b86ff',
          600: '#475eff',
          700: '#3348eb',
          800: '#2839c4',
          900: '#25339d',
          950: '#161d61',
        },
      },
    },
  },
  plugins: [],
}
