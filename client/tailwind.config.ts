import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3fb",
          100: "#d9e4f5",
          200: "#b6cbeb",
          300: "#87a7da",
          400: "#5a80c4",
          500: "#3a61ab",
          600: "#2a4b8f",
          700: "#1f3a73",
          800: "#1a305e",
          900: "#15264a",
          950: "#0d1830",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px rgb(15 23 42 / 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
