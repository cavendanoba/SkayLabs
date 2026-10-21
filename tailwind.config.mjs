/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0B0B1A',
        surface: '#161129',
        border: '#2c2450',
        accent: '#B23FD1',
        accentLight: '#FFC9EA',
        muted: '#9a90c0',
      },
      fontFamily: {
        sans: ['"Poppins"', 'system-ui', 'sans-serif'],
        display: ['"Prosto One"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
