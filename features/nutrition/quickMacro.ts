/**
 * QUICK-MACRO RAPID NUMERICAL ENGINE
 * Rapid inputs for Protein, Carbs, Fats, and Total Calories with instant macro math.
 */

export interface MacroPayload {
  name: string;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  caloriesKcal: number;
}

export interface QuickMacroPreset {
  id: string;
  name: string;
  category: 'Shake' | 'Meal' | 'Snack';
  proteinG: number;
  carbsG: number;
  fatsG: number;
  caloriesKcal: number;
}

/**
 * Standard Atwater general factor system:
 * 4 kcal per gram of protein
 * 4 kcal per gram of carbohydrates
 * 9 kcal per gram of fat
 */
export function calculateCaloriesFromMacros(proteinG: number, carbsG: number, fatsG: number): number {
  const p = Math.max(0, proteinG);
  const c = Math.max(0, carbsG);
  const f = Math.max(0, fatsG);
  return Math.round(p * 4 + c * 4 + f * 9);
}

/**
 * Battle-tested rapid presets for bodybuilders & strength athletes
 */
export const QUICK_MACRO_PRESETS: QuickMacroPreset[] = [
  {
    id: 'preset-whey-shake',
    name: 'Whey Isolate Shake',
    category: 'Shake',
    proteinG: 30,
    carbsG: 3,
    fatsG: 1,
    caloriesKcal: 141,
  },
  {
    id: 'preset-chicken-rice',
    name: 'Grilled Chicken & Jasmine Rice',
    category: 'Meal',
    proteinG: 45,
    carbsG: 65,
    fatsG: 6,
    caloriesKcal: 494,
  },
  {
    id: 'preset-beef-potato',
    name: 'Lean Beef & Roasted Potato',
    category: 'Meal',
    proteinG: 40,
    carbsG: 45,
    fatsG: 14,
    caloriesKcal: 466,
  },
  {
    id: 'preset-eggs-oats',
    name: 'Eggs & Oatmeal Champion Bowl',
    category: 'Meal',
    proteinG: 24,
    carbsG: 42,
    fatsG: 16,
    caloriesKcal: 408,
  },
  {
    id: 'preset-greek-yogurt',
    name: 'Greek Yogurt 0% & Blueberries',
    category: 'Snack',
    proteinG: 20,
    carbsG: 16,
    fatsG: 0,
    caloriesKcal: 144,
  },
  {
    id: 'preset-tuna-toast',
    name: 'Albacore Tuna on Sourdough',
    category: 'Meal',
    proteinG: 34,
    carbsG: 36,
    fatsG: 4,
    caloriesKcal: 316,
  },
];

/**
 * Macro step increments for lightning-fast numerical logging
 */
export const MACRO_STEPPERS = {
  protein: [5, 10, 25],
  carbs: [10, 25, 50],
  fats: [2, 5, 10],
  calories: [50, 100, 250],
} as const;
