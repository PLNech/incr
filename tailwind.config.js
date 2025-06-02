/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf7f0',
          100: '#faebd7',
          200: '#f4d4a7',
          300: '#edb876',
          400: '#e69c45',
          500: '#d4822a',
          600: '#b86d1f',
          700: '#9a5a1a',
          800: '#7f4916',
          900: '#6b3e14',
        }
      },
      fontFamily: {
        'coffee': ['Georgia', 'serif'],
      },
      animation: {
        'steam': 'steam 2s ease-in-out infinite',
        'grind': 'grind 0.5s ease-in-out',
      },
      keyframes: {
        steam: {
          '0%, 100%': { opacity: 0.4, transform: 'translateY(0px)' },
          '50%': { opacity: 0.8, transform: 'translateY(-10px)' },
        },
        grind: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        }
      }
    },
  },
  plugins: [],
}