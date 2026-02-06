import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgb(226 232 240)', // slate-200
        // Using Tailwind's built-in orange, slate, and stone palettes
        primary: {
          50: 'rgb(255 247 237)',
          100: 'rgb(255 237 213)',
          200: 'rgb(254 215 170)',
          300: 'rgb(253 186 116)',
          400: 'rgb(251 146 60)',
          500: 'rgb(249 115 22)',
          600: 'rgb(234 88 12)',
          700: 'rgb(194 65 12)',
          800: 'rgb(154 52 18)',
          900: 'rgb(124 45 18)',
          950: 'rgb(67 20 7)',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
