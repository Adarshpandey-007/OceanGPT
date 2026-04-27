/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        ocean: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49'
        },
        floatchat: {
          primary: '#051014',      // Deep midnight blue base
          secondary: '#07242C',    // Slightly lighter for panels
          accent: '#00F0FF',       // Neon cyan for primary actions
          accentSoft: 'rgba(0, 240, 255, 0.1)',
          accentCoral: '#FF4545',  // Energetic coral for warnings/highlights
          bg: '#030B0E',           // Very dark background
          bgAlt: '#05141A',
          panel: 'rgba(7, 36, 44, 0.45)',
          panelAlt: 'rgba(12, 56, 69, 0.6)',
          ink: '#E0F2FE',          // Light cyan text
          inkMuted: '#7DD3FC',
          border: 'rgba(0, 240, 255, 0.15)',
          borderStrong: 'rgba(0, 240, 255, 0.35)',
          success: '#00FF9D',
          warning: '#FFB800',
          danger: '#FF4545',
          gradientFrom: '#00F0FF',
          gradientMid: '#0284C7',
          gradientTo: '#FF4545'
        }
      },
      backgroundImage: {
        'ocean-midnight': 'radial-gradient(circle at top right, rgba(0, 240, 255, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(255, 69, 69, 0.05), transparent 40%), linear-gradient(135deg, #030B0E 0%, #05141A 100%)',
        'ocean-panel': 'linear-gradient(180deg, rgba(7, 36, 44, 0.45) 0%, rgba(5, 20, 26, 0.6) 100%)'
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear'
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.1)',
        'neon-coral': '0 0 10px rgba(255, 69, 69, 0.3), 0 0 20px rgba(255, 69, 69, 0.1)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.5)'
      },
      backdropBlur: {
        'md': '12px',
        'lg': '24px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
