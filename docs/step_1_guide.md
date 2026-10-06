# Step 1: Project Setup, Dark-Mode Design System & Graphify Integration

This runbook covers the end-to-end configuration for initializing the **IronForge** React Native (Expo) project, configuring NativeWind styling, wiring the dark fitness visual tokens, and setting up **Graphify** so the Antigravity agent understands your entire codebase relationship map without context rot.

---

## Breakdown of Micro-Steps

1. **Sub-Step 1.1**: Expo Project Initialization
2. **Sub-Step 1.2**: Core Dependency & NativeWind Installation
3. **Sub-Step 1.3**: Styling & Babel Configuration
4. **Sub-Step 1.4**: Global CSS & TypeScript Auto-Complete Configuration
5. **Sub-Step 1.5**: Design Token Foundations & Theme Setup
6. **Sub-Step 1.6**: Graphify Installation & Antigravity Skill Registration
7. **Sub-Step 1.7**: Antigravity Project Directives (`.antigravity/rules.md`)
8. **Sub-Step 1.8**: Smoke Test & Dev Server Verification

---

## Sub-Step 1.1: Expo Project Initialization

Open your terminal, navigate to your development directory, and create the blank Expo project configured with TypeScript:

```bash
npx create-expo-app@latest IronForge --template blank-typescript
cd IronForge
```

---

## Sub-Step 1.2: Core Dependency & NativeWind Installation

Install **NativeWind v4**, **Tailwind CSS**, **Reanimated**, **Safe Area Context**, and **Lucide Icons** for the modern dark gym UI:

```bash
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context lucide-react-native
```

---

## Sub-Step 1.3: Styling & Babel Configuration

### 1. Initialize Tailwind Config
```bash
npx tailwindcss init
```

### 2. Update `tailwind.config.js`
Replace the content of `tailwind.config.js` with your dark fitness aesthetic:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0B0E",      // Main background
        surface: "#14171F",       // Card background
        "surface-subtle": "#1E222D", // Hover / elevated surface
        accent: "#10B981",        // Neon emerald accent
        "accent-glow": "rgba(16, 185, 129, 0.15)",
        muted: "#94A3B8",         // Inactive text / subheadings
        border: "#282F3F",        // Card & divider borders
        danger: "#EF4444",        // Fatiguing / fail zones
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
```

### 3. Update `babel.config.js`
Enable NativeWind's Babel preset and Reanimated plugin:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

---

## Sub-Step 1.4: Global CSS & TypeScript Auto-Complete

### 1. Create `global.css` in root
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. Create `nativewind-env.d.ts` in root
```typescript
/// <reference types="nativewind/types" />
```

---

## Sub-Step 1.5: Design Token Foundations & Theme Setup

Create your root layout to inject `global.css` and supply dark-theme context.

Create/modify `App.tsx` (or `app/_layout.tsx` if using Expo Router):

```tsx
import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, View, Text, Pressable } from "react-native";
import { Dumbbell, Sparkles } from "lucide-react-native";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-obsidian">
      <StatusBar style="light" />
      <View className="flex-1 px-6 justify-center items-center">
        
        {/* Glow Badge */}
        <View className="flex-row items-center px-4 py-1.5 rounded-full bg-surface border border-accent/30 mb-6 shadow-sm">
          <Sparkles size={16} color="#10B981" />
          <Text className="text-accent text-xs font-semibold ml-2 tracking-wider uppercase">
            System Online
          </Text>
        </View>

        {/* Headline */}
        <Text className="text-3xl font-extrabold text-white text-center tracking-tight">
          IronForge AI
        </Text>
        <Text className="text-muted text-sm text-center mt-2 max-w-[280px]">
          Targeted hyper-growth, fridge macro vision, and dynamic physique ranking.
        </Text>

        {/* Status Card */}
        <View className="w-full mt-8 p-5 rounded-2xl bg-surface border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Dumbbell size={20} color="#10B981" />
              <Text className="text-white font-bold ml-2">Core Pipeline</Text>
            </View>
            <Text className="text-xs text-accent font-semibold">NativeWind v4</Text>
          </View>
          <Text className="text-muted text-xs leading-5">
            Design tokens, dark-mode boundaries, and AST graph mapping active.
          </Text>
        </View>

        {/* CTA Button */}
        <Pressable 
          className="w-full mt-6 py-4 rounded-xl bg-accent active:opacity-85 flex-row justify-center items-center shadow-lg"
          onPress={() => console.log("System Initialized")}
        >
          <Text className="text-obsidian font-bold text-base tracking-wide">
            ENTER FORGE
          </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
```

---

## Sub-Step 1.6: Graphify Installation & Antigravity Skill Registration

Graphify extracts an Abstract Syntax Tree (AST) knowledge graph of your project without spending LLM tokens. It indexes your React Native components, Supabase queries, and Gemini functions into a persistent graph (`graphify-out/`).

### 1. Install Graphify CLI
Use `uv` (recommended) or `pipx`:
```bash
# Recommended
uv tool install graphifyy

# Or using pipx
pipx install graphifyy
```

### 2. Register Graphify with Google Antigravity
From inside the `IronForge` root folder, run:
```bash
graphify antigravity install
```
*This installs the Antigravity skill directive into `.agents/skills/graphify/SKILL.md` (or `.antigravity/skills/`), instructing the Antigravity agent to query the graph (`graphify query "<topic>"`) prior to modifying code.*

### 3. Build the Initial Codebase Knowledge Graph
Run the local graph extraction command:
```bash
graphify .
```
This generates the `graphify-out/` folder containing:
* `graph.html`: Visual interactive map of modules and imports.
* `GRAPH_REPORT.md`: Architectural summary and dependency bridges.
* `graph.json`: Machine-queryable graph for the Antigravity agent.

---

## Sub-Step 1.7: Antigravity Project Directives (`.antigravity/rules.md`)

Create a rules file at `.antigravity/rules.md` so the agent strictly adheres to your stack, design rules, and Graphify workflow:

```markdown
# Antigravity Agent Directive — IronForge

## 1. Codebase Navigation via Graphify
- **MANDATORY**: Before creating new screens, altering navigation, or linking Supabase schemas, you must consult the knowledge graph using:
  `graphify query "<query_term>"` or read `graphify-out/GRAPH_REPORT.md`.
- Never search blind via recursive grep if a graph relation exists.
- After substantial file additions, run `graphify .` to update graph links.

## 2. Platform & Framework Rules
- Framework: React Native with Expo (TypeScript).
- Styling: Strictly NativeWind (Tailwind CSS classes).
- DO NOT use web DOM elements (`div`, `span`, `p`, `button`, `img`). Use `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `FlatList`.
- Strictly Dark Mode: `bg-obsidian`, cards with `bg-surface border border-border`, highlights with `text-accent` (#10B981).

## 3. UI/UX Standards
- Touch feedback: All `Pressable` components must specify `active:opacity-80` or Reanimated spring feedback.
- Safe Area: Every full screen must be wrapped in `SafeAreaView` from `react-native-safe-area-context`.
- Spacing & Typography: Maintain high visual contrast, bold numerical statistics (S-tier / A-tier muscle badges), and clean glassmorphic cards.
```

---

## Sub-Step 1.8: Smoke Test & Dev Server Verification

Start the Expo bundler with cache cleared to verify NativeWind and Reanimated compilation:

```bash
npx expo start -c
```

1. Press `i` to launch in iOS Simulator, `a` for Android Emulator, or scan the QR code using the Expo Go mobile app.
2. Confirm the Obsidian `#0A0B0E` background, emerald accents, and Lucide icons render properly.
3. Test a quick Graphify query in your terminal:
   ```bash
   graphify query "App"
   ```
   Ensure it outputs the node relationship for `App.tsx` and its imports.