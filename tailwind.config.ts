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
        /** Monochrome: lines / focus rings (same as white — kept as semantic token) */
        brand: "#ffffff",
        /** Portfolio accent palette (use with /opacity in class names) */
        az: {
          navy: "#002A79",
          purple: "#512B87",
          magenta: "#891446",
          red: "#AE0C00",
          bright: "#D80515",
        },
      },
      maxWidth: {
        measure: "42rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
