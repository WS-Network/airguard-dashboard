/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ag-lime': '#d8ff43',
        'ag-green': '#bae225',
        'ag-black': '#191919',
        'ag-white': '#f2f2f2',
        'ag-red': '#ff5643',
        'ag-orange': '#ff9633',
        'ag-neon-green': '#43ff72',
        'ag-neon-blue': '#43ffd6',
      },
      brightness: {
        '90': '.9',
        '115': '1.15',
      },
      borderWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [],
}
