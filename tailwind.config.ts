import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "hsl(var(--ink) / <alpha-value>)",
        paper: "hsl(var(--paper) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
        brand: "#E63946",
      },
      maxWidth: {
        measure: "42rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
