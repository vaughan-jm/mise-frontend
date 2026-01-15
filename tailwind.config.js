/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cast Iron & Steam palette
        obsidian: '#121212',
        gunmetal: '#1E1E1E',
        bone: '#E0E0E0',
        ash: '#A0A0A0',
        sage: '#7B927A',
        'sage-hover': '#6A8069',
        rust: '#8B4A4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
