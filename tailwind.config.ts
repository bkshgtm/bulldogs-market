import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#800000", // AAMU Maroon
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#B9985A", // AAMU Gold
          foreground: "#ffffff",
        },
        background: "#f9f9f9",
        foreground: "#1f1f1f",
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1f1f1f",
        },
        border: "#e5e7eb",
        input: "#ffffff",
        ring: "#800000",
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
