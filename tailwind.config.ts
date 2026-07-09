import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1b3a5c", // MonthStayz navy
          dark: "#0f2540",
          light: "#eef3f9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
