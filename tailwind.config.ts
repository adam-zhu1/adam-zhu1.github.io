import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', "Impact", "ui-sans-serif", "system-ui", "sans-serif"],
        /** Nearly all copy is font-mono; IBM Plex Mono keeps it identical across OSes. */
        mono: [
          '"IBM Plex Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      colors: {
        az: {
          /** Quiet accent — lightened tint of navy for active states and small marks on black. */
          indigo: "#8FA8F0",
        },
      },
      maxWidth: {
        measure: "42rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
