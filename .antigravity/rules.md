# Antigravity Agent Directive — IronForge

## 1. Codebase Navigation via Graphify
- **MANDATORY**: Consult `graphify.json` to understand domain relationships prior to altering architectures or linking schemas:
  - `[User] -> HAS_MANY -> [BodyScan]`
  - `[BodyScan] -> GENERATES -> [MuscleRankings]`
  - `[MuscleRankings] -> PRIORITIZES -> [WorkoutPlan]`
  - `[FridgeScan] -> DETECTS -> [Ingredients]`
  - `[Ingredients] + [TargetMacros] -> ASSEMBLES -> [SmartRecipes]`
- Never search blind if an architectural entity relationship already defines the contract.

## 2. Platform & Framework Rules
- Framework: React Native with Expo (TypeScript).
- Styling: Strictly NativeWind (Tailwind CSS utility classes).
- DO NOT use web DOM elements (`div`, `span`, `p`, `button`, `img`). Use React Native primitives: `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `FlatList`.
- Theme Palette:
  - Background: `bg-obsidian` (`#090A0F`)
  - Cards: `bg-surface` (`#12151E`) and `bg-surface-card` (`#1A1F2C`)
  - Border: `border-border-dark` (`#1E293B`)
  - Accent: `accent` (`#10B981` toxic emerald green) with glow `accent-glow` (`rgba(16, 185, 129, 0.15)`)
  - Telemetry Accent: `neon-cyan` (`#06B6D4`)
  - Muted Text: `text-dim` (`#94A3B8`)

## 3. UI/UX Standards
- Touch feedback: All touchable elements must specify active feedback (`active:opacity-80` or Reanimated spring transitions).
- Safe Area: Every screen root must respect safe areas with `SafeAreaView` from `react-native-safe-area-context`.
- Typography & Badges: High contrast telemetry metrics with bold numbers and glowing tier badges (S, A, B, C).
