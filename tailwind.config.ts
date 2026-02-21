import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0a1a',
          100: '#141428',
          200: '#1a1a35',
          300: '#222244',
          400: '#2a2a55',
        },
        gold: { DEFAULT: '#C9A84C', light: '#D4BA6A', dark: '#B89A3F' },
        status: {
          todo: '#FBBF24',
          progress: '#3B82F6',
          done: '#22C55E',
          urgent: '#EF4444',
        },
        priority: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#22C55E',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
