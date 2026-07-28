import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Chrome — deep-space command center
        plane: "#05070c",
        surface: "#10141f",
        "surface-raised": "#161b29",
        "surface-hairline": "rgba(255,255,255,0.08)",
        ink: {
          primary: "#eef1fb",
          secondary: "#97a3c4",
          muted: "#5b6580",
        },
        // Brand accent (chrome/UI only — never used to encode data)
        accent: {
          cyan: "#22e5ff",
          violet: "#8b6bf2",
        },
        // Validated categorical series (dark-mode steps, fixed order — see dataviz skill)
        series: {
          1: "#3987e5", // blue
          2: "#d95926", // orange
          3: "#199e70", // aqua
          4: "#c98500", // yellow
          5: "#d55181", // magenta
          6: "#008300", // green
          7: "#9085e9", // violet
          8: "#e66767", // red
        },
        // Status palette — fixed, never reused for series identity
        status: {
          good: "#0ca30c",
          warning: "#fab219",
          serious: "#ec835a",
          critical: "#d03b3b",
        },
        // Sequential single-hue ramp (blue), for meters / magnitude
        seq: {
          100: "#cde2fb",
          200: "#9ec5f4",
          300: "#6da7ec",
          400: "#3987e5",
          500: "#256abf",
          600: "#184f95",
          700: "#0d366b",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,229,255,0.15), 0 0 24px -4px rgba(34,229,255,0.25)",
        "glow-violet": "0 0 0 1px rgba(139,107,242,0.15), 0 0 24px -4px rgba(139,107,242,0.25)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
