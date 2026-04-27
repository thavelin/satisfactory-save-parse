/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          orange: '#E8A214',
          dark: '#0D1117',
          card: '#161B22',
          border: '#30363D',
          text: '#C9D1D9',
          muted: '#8B949E',
          green: '#3FB950',
          red: '#F85149',
          yellow: '#D29922',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
