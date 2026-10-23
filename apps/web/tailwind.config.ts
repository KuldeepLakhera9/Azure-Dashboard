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
        page: "var(--bg-page)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
        },
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        border: {
          DEFAULT: "var(--border-color)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          hover: "var(--accent-hover)",
        },
        semantic: {
          success: {
            DEFAULT: "var(--status-success)",
            bg: "var(--status-success-bg)",
          },
          warning: {
            DEFAULT: "var(--status-warning)",
            bg: "var(--status-warning-bg)",
          },
          critical: {
            DEFAULT: "var(--status-critical)",
            bg: "var(--status-critical-bg)",
          },
          info: {
            DEFAULT: "var(--status-info)",
            bg: "var(--status-info-bg)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "kpi": ["32px", { lineHeight: "38px", fontWeight: "700" }],
        "page-title": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "section-title": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body": ["14px", { lineHeight: "20px" }],
        "supporting": ["12px", { lineHeight: "16px" }],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        popover: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
