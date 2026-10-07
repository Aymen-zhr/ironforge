/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
        // Liquid Obsidian & Blood Ember Tokens
        "forge-abyss": "#050507",
        "forge-surface": "#0E0E12",
        "forge-elevated": "#16161C",
        "border-subtle": "rgba(255, 255, 255, 0.06)",
        "border-active": "rgba(225, 29, 72, 0.35)",
        "ember-primary": "#E11D48",
        "ember-glow": "#BE123C",
        "ember-muted": "#4C0519",
        "bone-white": "#F8FAFC",
        "slate-muted": "#94A3B8",

        // Luxury Editorial Tokens
        "obsidian-black": "#09090B",
        "muted-ash": "#71717A",
        "border-editorial": "rgba(255, 255, 255, 0.08)",

        // Blood-Iron & Biomechanics Aliases
        "forge-black": "#050507",
        "forge-dark": "#0E0E12",
        "forge-border": "rgba(255, 255, 255, 0.06)",
        "blood-red": "#E11D48",
        "blood-dark": "#BE123C",
        "blood-glow": "rgba(225, 29, 72, 0.25)",
        "ash-gray": "#94A3B8",

        // System Compatibility Aliases
        obsidian: "#050507",
        surface: "#0E0E12",
        "surface-card": "#0E0E12",
        accent: "#E11D48",
        "accent-glow": "rgba(225, 29, 72, 0.25)",
        "neon-cyan": "#06B6D4",
        "text-dim": "#94A3B8",
        "border-dark": "rgba(255, 255, 255, 0.06)",
        muted: "#94A3B8",
        border: "rgba(255, 255, 255, 0.06)",
        danger: "#E11D48",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
