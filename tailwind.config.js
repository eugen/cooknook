/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        parchment: {
          50:  '#fdf8f0',
          100: '#f9eedb',
          200: '#f2dbb8',
          300: '#e8c28d',
          400: '#dca362',
          500: '#d08a42',
          600: '#b87232',
          700: '#97592a',
          800: '#7a4727',
          900: '#643c24',
        },
        nook: {
          dark:   '#1c1a17',
          medium: '#2e2b26',
          warm:   '#3d3830',
          ink:    '#4a4540',
          muted:  '#8a8278',
          light:  '#c4bdb4',
        },
        sage: {
          400: '#87a878',
          500: '#6e9260',
          600: '#587649',
        },
        ember: {
          400: '#e8724a',
          500: '#d4562e',
          600: '#b84422',
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
