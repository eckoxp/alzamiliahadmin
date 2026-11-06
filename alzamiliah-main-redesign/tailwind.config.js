/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        fustat: ['Fustat', 'sans-serif'],
        NotoKufi: ['Noto Kufi Arabic', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out',
        'orbit-glow': 'orbit-glow 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'orbit-glow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
    },
  },
  plugins: [],
}

