/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.ts",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        obsidian: "#090A0F", // deep black background
        surface: "#12151E", // card background
        "surface-card": "#1A1F2C", // elevated card
        accent: "#10B981", // toxic emerald green
        "accent-glow": "rgba(16, 185, 129, 0.15)",
        "neon-cyan": "#06B6D4", // secondary telemetry accent
        "text-dim": "#94A3B8", // secondary text
        "border-dark": "#1E293B", // dark border
        muted: "#94A3B8",
        border: "#1E293B",
        danger: "#EF4444",
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
