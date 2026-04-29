/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '340px',
      },
      fontSize: {
        xs: ["clamp(0.72rem, 0.68rem + 0.2vw, 0.8rem)", { lineHeight: "1.4" }],
        sm: ["clamp(0.85rem, 0.8rem + 0.25vw, 0.9rem)", { lineHeight: "1.5" }],
        base: ["clamp(0.95rem, 0.9rem + 0.3vw, 1rem)", { lineHeight: "1.6" }],
        lg: ["clamp(1.05rem, 1rem + 0.4vw, 1.125rem)", { lineHeight: "1.6" }],
        xl: ["clamp(1.2rem, 1.05rem + 0.6vw, 1.25rem)", { lineHeight: "1.4" }],
        "2xl": ["clamp(1.4rem, 1.2rem + 0.9vw, 1.5rem)", { lineHeight: "1.3" }],
        "3xl": ["clamp(1.7rem, 1.4rem + 1.2vw, 1.875rem)", { lineHeight: "1.25" }],
        "4xl": ["clamp(2rem, 1.6rem + 1.8vw, 2.25rem)", { lineHeight: "1.2" }],
        "5xl": ["clamp(2.4rem, 1.9rem + 2.4vw, 3rem)", { lineHeight: "1.1" }],
        "6xl": ["clamp(2.8rem, 2.2rem + 3vw, 3.75rem)", { lineHeight: "1.05" }],
      },
      colors: {
        primary: {
          DEFAULT: '#F73919', // main button color
          50: '#fff7ed',      // very light, near-white
          100: '#D5F0DD',     // light green
          200: '#A3D9A3',     // soft green
          300: '#7BC97A',     // medium-light green
          400: '#55B356',     // medium green
          500: '#3FAF54',     // main mid green
          600: '#219F4D',     // dark green
          700: '#3F7940',     // slightly lighter dark green
          800: '#6B5033',     // brownish-green, leaning toward warm
          900: '#F73919',     // very dark red-orange
        },
        secondary: {
          DEFAULT: '#000000',
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'light': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      width: {
        '30': '7.5rem', /* 120px */
      },
      height: {
        '30': '7.5rem', /* 120px */
      }
    },
  },
  plugins: [],
}
