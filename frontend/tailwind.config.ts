import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#131316',
        'on-background': '#e4e1e6',
        surface: '#131316',
        'surface-dim': '#131316',
        'surface-bright': '#39393c',
        'surface-container-lowest': '#0e0e11',
        'surface-container-low': '#1b1b1e',
        'surface-container': '#1f1f22',
        'surface-container-high': '#2a2a2d',
        'surface-container-highest': '#353438',
        'surface-variant': '#353438',
        'on-surface': '#e4e1e6',
        'on-surface-variant': '#cbc3d7',
        outline: '#958ea0',
        'outline-variant': '#494454',

        // Acentos Obsidian Signal
        primary: {
          DEFAULT: '#d0bcff',
          neon: '#8B5CF6',
          container: '#a078ff',
          'on-container': '#340080',
          hover: '#7C3AED',
        },
        secondary: {
          DEFAULT: '#4cd7f6',
          neon: '#06B6D4',
          container: '#03b5d3',
          'on-container': '#00424e',
        },
        tertiary: {
          DEFAULT: '#ffb2b7',
          neon: '#F43F5E',
          container: '#ff516a',
          'on-container': '#5b0017',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
          'on-container': '#ffdad6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        gutter: '1.25rem',
        'gutter-mobile': '0.75rem',
        margin: '2rem',
        'margin-mobile': '1rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

