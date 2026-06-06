/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'vb-dark': '#38BDF8',
        'vb-blue': '#4ADE80',
        'vb-card-border': '#e2e8f0'
      }
    }
  },
  plugins: [],
}
