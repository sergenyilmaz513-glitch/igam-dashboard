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
        cream: { DEFAULT: '#F5F3EE', dark: '#EDE9E0' },
        gold: { DEFAULT: '#C9A84C', light: '#D4BA6A', dark: '#B89A3F' },
        text: { primary: '#2D2A26', secondary: '#8A8480' },
        status: {
          todo: '#FBBF24',
          progress: '#60A5FA',
          done: '#34D399',
          urgent: '#F87171',
        },
        card: 'rgba(255,255,255,0.65)',
        border: 'rgba(0,0,0,0.06)',
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
