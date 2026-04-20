import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf6f1",
          100: "#f9e6d6",
          200: "#f0c7a5",
          300: "#e3a172",
          400: "#d3814f",
          500: "#b96736",
          600: "#98522a",
          700: "#7a4222",
          800: "#5d321b",
          900: "#3f2113",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
