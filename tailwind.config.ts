import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        compost: {
          light: "#dcfce7",
          DEFAULT: "#16a34a",
          dark: "#14532d",
        },
        recycling: {
          light: "#dbeafe",
          DEFAULT: "#2563eb",
          dark: "#1e3a8a",
        },
        trash: {
          light: "#f1f5f9",
          DEFAULT: "#475569",
          dark: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
