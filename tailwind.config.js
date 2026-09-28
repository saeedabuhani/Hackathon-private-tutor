// Colors that change between the dark and light theme are CSS variables holding "R G B"
// (defined per theme in app/globals.css). The `<alpha-value>` placeholder keeps Tailwind's
// opacity modifiers (bg-slate-950/60, border-indigo-800/40 ...) working. In the dark theme
// every value equals Tailwind's own default, so dark looks exactly as before.
const scale = (color, shades) =>
  Object.fromEntries(shades.map((s) => [s, `rgb(var(--${color}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Whole slate scale (the app's surfaces, borders and text) flips with the theme
        slate: scale("slate", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        // Tinted chips / banners / status text: only the shades the app uses
        indigo: scale("indigo", [200, 300, 400, 800, 900, 950]),
        amber: scale("amber", [300, 400, 800, 900, 950]),
        emerald: scale("emerald", [400, 800, 900, 950]),
        rose: scale("rose", [300, 800, 900, 950]),
        sky: scale("sky", [300, 900]),
        red: scale("red", [400]),
      },
    },
  },
  plugins: [],
};
