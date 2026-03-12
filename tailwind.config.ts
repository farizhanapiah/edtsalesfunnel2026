import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'edt-blue':    '#2D2DFF',
        'edt-black':   '#0A0A0A',
        'edt-grey':    '#8C8C8C',
        'edt-white':   '#FFFFFF',
        'edt-surface': '#111111',
        'bucket-small':  '#22C55E',
        'bucket-medium': '#F59E0B',
        'bucket-large':  '#A855F7',
      },
      fontFamily: {
        display: ['"Dela Gothic One"', 'sans-serif'],
        body:    ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px', md: '0px', lg: '0px', xl: '0px',
        '2xl': '0px', '3xl': '0px', full: '9999px',
      },
      boxShadow: {
        DEFAULT: 'none', sm: 'none', md: 'none',
        lg: 'none', xl: 'none', '2xl': 'none', inner: 'none',
      },
    },
  },
  plugins: [],
}

export default config
