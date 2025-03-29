/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          text: '#E0E0E0',
          border: '#333333',
          primary: '#3B82F6', // blue-500
        }
      }
    },
  },
  plugins: [],
} 