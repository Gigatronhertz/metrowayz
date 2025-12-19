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
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd1c2',
          300: '#ffb39a',
          400: '#ff8a66',
          500: '#ff6b3d',  // Vibrant coral orange
          600: '#f85428',
          700: '#e03f1a',
          800: '#c1341a',
          900: '#9d2c1c',
        },
        secondary: {
          50: '#f6f5ff',
          100: '#eeebff',
          200: '#dfd9ff',
          300: '#c8bdff',
          400: '#ab99ff',
          500: '#8b6dff',  // Rich purple
          600: '#7347ff',
          700: '#6333f5',
          800: '#5129d1',
          900: '#4324ab',
        },
        accent: {
          50: '#fff5f7',
          100: '#ffe0e8',
          200: '#ffc7d6',
          300: '#ff9eb8',
          400: '#ff6691',
          500: '#ff3d7f',  // Accent pink-coral
          600: '#f01464',
          700: '#d10a54',
          800: '#ad0d4a',
          900: '#900f44',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e1e3e5',
          200: '#c3c6cb',
          300: '#9ea2a8',
          400: '#6c7178',
          500: '#4a4d54',
          600: '#33353b',
          700: '#26282c',
          800: '#1a1b1f',
          900: '#0f1013',  // Rich black
        },
        luxury: {
          cream: '#fdfbf7',
          pearl: '#f8f6f3',
          smoke: '#e8e6e3',
          gold: '#d4af37',
          bronze: '#cd7f32',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'luxury-hover': '0 16px 48px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(255, 107, 61, 0.3), 0 0 40px rgba(139, 109, 255, 0.2)',
        'inner-luxury': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 61, 0.3), 0 0 40px rgba(139, 109, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 107, 61, 0.5), 0 0 60px rgba(139, 109, 255, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}