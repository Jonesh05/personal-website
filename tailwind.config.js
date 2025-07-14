/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          DEFAULT: '#0ea5e9'
        },
        'primary-500': '#A855F7',
        'primary-600': '#9333EA',
        'primary-700': '#7E22CE',
        bluish: "#7182ff",
        greenish: "#3cff52",
        'bg-light': 'hsla(0, 0%, 95%, 1)', // Gris claro
        'bg-blue': 'hsla(210, 100%, 95%, 1)', // Azul suave
        'bg-lavender': 'hsla(240, 100%, 90%, 1)', // Lavanda claro
        'bg-mint': 'hsla(160, 100%, 90%, 1)', // Verde menta suave
      },
      dropShadow: {
        'text-glow': '0 0 4px rgba(0,0,0,0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
