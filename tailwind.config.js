/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#60a5fa',  // blue-400
          DEFAULT: '#3b82f6', // blue-500
          dark: '#2563eb',    // blue-600
        },
        accent: {
          light: '#fb923c',   // orange-400
          DEFAULT: '#f97316', // orange-500
          dark: '#ea580c',    // orange-600
        },
        secondary: {
          light: '#a78bfa',   // violet-400
          DEFAULT: '#8b5cf6', // violet-500
          dark: '#7c3aed',    // violet-600
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
