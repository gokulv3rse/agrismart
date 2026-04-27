/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          500: '#10b981', // Emerald 500
          400: '#34d399', // Emerald 400
          100: '#d1fae5', // Emerald 100
          700: '#047857', // Emerald 700
        },
        ink: {
          900: '#0f172a', // Slate 900
          600: '#475569', // Slate 600
          100: '#f1f5f9', // Slate 100
          400: '#94a3b8', // Slate 400
        },
        neutral: {
          100: '#ffffff', // Pure white
          200: '#f8fafc', // Very light slate
          300: '#e2e8f0', // Slate 200
        },
        semantic: {
          danger: '#ef4444',
          dangerDark: '#f87171',
          warning: '#f59e0b',
          info: '#3b82f6',
          success: '#10b981',
        },
      },
      backgroundImage: {
        // Replacing legacy gradients with flat colors for clean look
        'app-light': 'linear-gradient(to bottom, #f8fafc, #f8fafc)',
        'app-dark': 'linear-gradient(to bottom, #0f172a, #0f172a)',
      },
      boxShadow: {
        glass: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};
