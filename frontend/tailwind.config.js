/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#12151C',
        surface: '#1A1E27',
        'surface-raised': '#232838',
        border: '#2C3243',
        ink: '#EDEFF3',
        muted: '#8A93A6',
        faint: '#5B6377',
        signal: '#F0A83C', // caution amber — the one accent, used for primary action + risk emphasis
        'signal-dim': '#8A6326',
        safe: '#3FB8A5',
        danger: '#E0596B',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
        md: '6px',
      },
    },
  },
  plugins: [],
};
