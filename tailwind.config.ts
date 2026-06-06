import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'] as any,
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text-primary)',
        border: 'var(--border)',
        input: 'var(--bg-3)',
        ring: 'var(--accent-blue)',
        primary: {
          DEFAULT: 'var(--accent-blue)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--bg-3)',
          foreground: 'var(--text-secondary)',
        },
        muted: {
          DEFAULT: 'var(--bg-4)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--bg-3)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'var(--accent-red)',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'var(--bg-2)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--bg-3)',
          foreground: 'var(--text-primary)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius-sm)',
        sm: '6px',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
