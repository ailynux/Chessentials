/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  purge: {
    enabled: true,
    content: [
      './templates/**/*.html',
      './static/**/*.js',
    ]
  },
}
