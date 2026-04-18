/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          500: '#4a7c59',
          400: '#7ba662',
          100: '#d4e4d9',
          700: '#3f6a4c',
        },
        ink: {
          900: '#2d3319',
          600: '#6b7160',
          100: '#e8ebe5',
          400: '#9ca398',
        },
        neutral: {
          100: '#f4f1e8',
          200: '#e8e6dd',
          300: '#cbced4',
        },
        semantic: {
          danger: '#c44536',
          dangerDark: '#d45949',
          warning: '#c9a959',
          info: '#5a8aa5',
          success: '#7ba662',
        },
      },
      backgroundImage: {
        'app-light': 'linear-gradient(135deg, #f8faf6 0%, #f0f4e8 40%, #e8f2dc 100%)',
        'app-dark': 'linear-gradient(135deg, #1a1f16 0%, #1e2318 40%, #22281c 100%)',
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0, 0, 0, 0.10)',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};
