/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.22s ease-out',
      },
      colors: {
        surface: '#0a0a0f',
        panel: '#0d0d18',
        border: '#1e293b',
        amber: {
          400: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
