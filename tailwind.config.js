/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Wedding pastel colors
        'pastel-pink': {
          50: '#fef5f8',
          100: '#fde9f0',
          200: '#fbd4e1',
          300: '#f8b0ca',
          400: '#f48aaf',
          500: '#ec5f91',
          DEFAULT: '#fbd4e1', // Main pastel pink
        },
        'pastel-green': {
          50: '#f4faf5',
          100: '#e6f4e8',
          200: '#cde8d2',
          300: '#a8d5b0',
          400: '#7fbe8d',
          500: '#5da76e',
          DEFAULT: '#cde8d2', // Main pastel green
        },
      },
    },
  },
  plugins: [],
}

