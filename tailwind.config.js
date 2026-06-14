/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/views/**/*.blade.php",
    "./resources/js/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brenger-inspired customer theme (blue/white/green)
        paper: "#FFFFFF",
        ink: "#0B1220",         // near-black for body text
        "ink-2": "#374151",     // secondary text
        "ink-3": "#64748B",     // muted text
        navy: {
          DEFAULT: "#0F2E78",   // headings
          deep: "#0A2358",      // strongest headings
        },
        blue: {
          DEFAULT: "#1E66F5",   // primary brand blue (links, icons, step circles)
          dark: "#0F4FE0",      // hover
          deep: "#0A3FBA",
        },
        sky: {
          50: "#F4F8FE",
          100: "#E5EEFB",       // sidebar / hero band
          200: "#C7D7F1",       // soft border
          300: "#9DBAEC",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",       // input/card border
          300: "#CBD5E1",
          500: "#64748B",       // body muted
          700: "#334155",
        },
        green: {
          DEFAULT: "#1FCB85",   // CTA primary
          dark: "#0FAD6E",      // hover
          deep: "#0B8C57",
          soft: "#DEFAEB",
        },
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn .25s ease-out",
      },
    },
  },
  plugins: [],
};
