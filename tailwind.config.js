/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './admin.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        serif:   ['Fraunces', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Primary brand — emerald
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Contrast highlight — terracotta & orange
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // Warm canvas palette
        canvas: {
          base:   '#FAFAF7',
          card:   '#FFFFFF',
          hover:  '#F5F3EE',
          subtle: '#EDE9E1',
          border: '#E5E1D8',
        },
        stone: {
          850: '#1f1c19',
          925: '#12100e',
        },
      },
      boxShadow: {
        'xs':            '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs':           '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card':          '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover':    '0 6px 24px 0 rgba(0,0,0,0.10), 0 2px 6px -1px rgba(0,0,0,0.05)',
        'card-warm':     '0 2px 12px 0 rgba(120,53,15,0.06)',
        'tactile-sm':    '2px 2px 0px 0px rgba(28,25,23,0.9)',
        'tactile':       '3px 3px 0px 0px rgba(28,25,23,0.95)',
        'tactile-lg':    '4px 4px 0px 0px rgba(28,25,23,1)',
        'tactile-dark':  '3px 3px 0px 0px rgba(68,64,60,0.95)',
        'tactile-dark-lg': '4px 4px 0px 0px rgba(68,64,60,1)',
        'glow-emerald':  '0 0 20px -4px rgba(16,185,129,0.35)',
        'glow-orange':   '0 0 20px -4px rgba(249,115,22,0.35)',
        'inner-warm':    'inset 0 1px 3px 0 rgba(120,53,15,0.06)',
      },
      animation: {
        'fade-in':    'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s infinite linear',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
