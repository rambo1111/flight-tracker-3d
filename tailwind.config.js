/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
        display: ['"Space Mono"', 'monospace'],
      },
      colors: {
        accent:   '#FFE500',
        'alt-low':    '#00FF88',
        'alt-mid':    '#FFE500',
        'alt-high':   '#FF6B35',
        'alt-cruise': '#80CFFF',
        'surface':    '#08080F',
        'surface-2':  '#0E0E1A',
      },
      boxShadow: {
        'neo':        '3px 3px 0px rgba(255,255,255,0.18)',
        'neo-accent': '3px 3px 0px #FFE500',
        'neo-hover':  '5px 5px 0px rgba(255,255,255,0.25)',
        'neo-inset':  'inset 2px 2px 0px rgba(255,255,255,0.08)',
      },
      animation: {
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'fade-in':       'fadeIn 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right':'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'blink':         'blink 1.4s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
