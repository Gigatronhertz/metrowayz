/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc071',
          400: '#ff9f3c',
          500: '#ff8c1a',
          600: '#f07000',
          700: '#c75600',
          800: '#9e4300',
          900: '#7f3700',
        },
        secondary: {
          50: '#f3eef8',
          100: '#e4d7ed',
          200: '#cbb0db',
          300: '#af88c6',
          400: '#8f61ad',
          500: '#5b3a8f',
          600: '#4d2f7a',
          700: '#3f2564',
          800: '#321d50',
          900: '#271741',
        },
        accent: {
          50: '#f3eef8',
          100: '#e4d7ed',
          200: '#cbb0db',
          300: '#af88c6',
          400: '#8f61ad',
          500: '#5b3a8f',
          600: '#4d2f7a',
          700: '#3f2564',
          800: '#321d50',
          900: '#271741',
        },
        gray: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#dddddd',
          300: '#cccccc',
          400: '#999999',
          500: '#717171',
          600: '#555555',
          700: '#333333',
          800: '#222222',
          900: '#111111',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}