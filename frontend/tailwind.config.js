/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'vb-dark': '#031329',
        'vb-blue': '#1d4ed8',
        'vb-card-border': '#e2e8f0'
      }
    }
  },
  plugins: [],
}
