/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        glass: {
          100: 'rgba(0, 0, 0, 0.7)',
          200: 'rgba(20, 20, 20, 0.7)',
          border: 'rgba(255, 255, 255, 0.2)',
          highlight: 'rgba(255, 255, 255, 0.1)',
        },
        chrome: {
          bg: 'rgba(0, 0, 0, 0.85)',
          border: 'rgba(38, 38, 38, 0.8)',
          highlight: 'rgba(255, 255, 255, 0.05)',
        }
      },
      spacing: {
        'nav-top': '16px',
        'panel-top': '72px',
        'panel-bottom': '44px',
        'panel-width': '280px',
      },
      zIndex: {
        'manifest': '40',
        'inspector': '40',
        'minimap': '45',
        'nav-stack': '50',
        'status-bar': '60',
        'terminal': '70',
        'modal': '100',
      },
      boxShadow: {
        'chrome': '0 0 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        'chrome-top': '0 5px 30px rgba(0,0,0,0.6)',
        'chrome-bottom': '0 -5px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
}
