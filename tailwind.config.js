/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        accent: {
          light: '#f97316',
          DEFAULT: '#ea580c',
          dark: '#c2410c',
        }
      }
    },
  },
  plugins: [],
}
