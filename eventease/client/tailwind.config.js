/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#3b6cf6',
          600: '#2551eb',
          700: '#1d3ed8',
          800: '#1e35ae',
          900: '#1e3189',
          950: '#172054',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,.07), 0 8px 24px rgba(16,24,40,.05)',
        'card-hover': '0 4px 10px rgba(16,24,40,.09), 0 16px 32px rgba(16,24,40,.08)',
      },
    },
  },
  plugins: [],
};
