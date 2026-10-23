import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & Accents (Restrained Azure Blue)
        azure: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fc",
          400: "#36aaf7",
          500: "#0078d4", // Official Microsoft Azure Blue
          600: "#0062b0",
          700: "#004e8e",
          800: "#034275",
          900: "#083761",
          950: "#04223f",
        },
        // Midnight Navy & Slate Neutrals
        midnight: {
          800: "#131d31",
          850: "#0f172a",
          900: "#0a0f1d",
          950: "#060912",
        },
        // Semantic Status Colors
        status: {
          success: {
            DEFAULT: "#10b981",
            bg: "#ecfdf5",
            border: "#a7f3d0",
            darkBg: "#064e3b33",
            darkText: "#34d399",
          },
          warning: {
            DEFAULT: "#f59e0b",
            bg: "#fffbeb",
            border: "#fde68a",
            darkBg: "#78350f33",
            darkText: "#fbbf24",
          },
          critical: {
            DEFAULT: "#ef4444",
            bg: "#fef2f2",
            border: "#fecaca",
            darkBg: "#7f1d1d33",
            darkText: "#f87171",
          },
          info: {
            DEFAULT: "#3b82f6",
            bg: "#eff6ff",
            border: "#bfdbfe",
            darkBg: "#1e3a8a33",
            darkText: "#60a5fa",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "76": "19rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
