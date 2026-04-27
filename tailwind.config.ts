import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: '#131313',
        surface2: '#1d1d1d',
        border: '#2a2a2a',
        text: '#f0ece6',
        muted: '#777777',
        accent: '#ff6b2b',
        'accent-2': '#ffc947',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
