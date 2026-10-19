/**
 * PURE BIOMETRIC NUTRITION MATH // Single Source of Truth
 * Deterministic BMR (Mifflin-St Jeor), TDEE, Unit Conversions, and Macro Splitting
 */

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor Equation:
 * Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female' = 'male'
): number {
  const safeWeight = Math.max(30, weightKg);
  const safeHeight = Math.max(100, heightCm);
  const safeAge = Math.max(12, age);

  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Calculates Total Daily Energy Expenditure from BMR and weekly training activity.
 */
export function calculateTDEE(bmr: number, daysPerWeek: number = 4): number {
  const multiplier = daysPerWeek <= 3 ? 1.375 : daysPerWeek <= 5 ? 1.55 : 1.725;
  return Math.round(bmr * multiplier);
}

export type GoalPhase = 'cut_agg' | 'cut_mod' | 'recomp' | 'lean_bulk' | 'bulk';

/**
 * Calculates target calories based on TDEE and the athletic goal phase.
 * - Aggressive Cut: TDEE - 500 kcal
 * - Moderate Cut: TDEE - 300 kcal
 * - Body Recomposition: TDEE
 * - Lean Bulk: TDEE + 250 kcal
 * - Hypertrophy Overdrive (Heavy Bulk): TDEE + 500 kcal
 */
export function calculateGoalCalories(tdee: number, goalPhase: GoalPhase = 'recomp'): number {
  switch (goalPhase) {
    case 'cut_agg':
      return Math.max(1200, Math.round(tdee - 500));
    case 'cut_mod':
      return Math.max(1200, Math.round(tdee - 300));
    case 'lean_bulk':
      return Math.round(tdee + 250);
    case 'bulk':
      return Math.round(tdee + 500);
    case 'recomp':
    default:
      return Math.round(tdee);
  }
}

/**
 * Calculates athletic macronutrient partitioning adhering to Section 4.A:
 * - Protein: 2.2g * weightKg (4 kcal/g)
 * - Fats: 0.9g * weightKg (9 kcal/g)
 * - Carbs: (Target Calories - [Protein*4 + Fats*9]) / 4
 */
export function calculateAthleteMacroSplit(targetCalories: number, weightKg: number) {
  const safeCals = Math.max(1200, Math.round(targetCalories));
  const safeWeight = Math.max(35, weightKg);

  const proteinG = Math.round(safeWeight * 2.2 * 10) / 10;
  const fatsG = Math.round(safeWeight * 0.9 * 10) / 10;

  const proteinCals = proteinG * 4;
  const fatsCals = fatsG * 9;

  const remainingCals = Math.max(0, safeCals - (proteinCals + fatsCals));
  const carbsG = Math.round((remainingCals / 4) * 10) / 10;

  return {
    calories: safeCals,
    protein: Math.round(proteinG),
    carbs: Math.round(carbsG),
    fats: Math.round(fatsG),
  };
}

/**
 * Calculates daily macro split based on calorie target and bodyweight.
 * Baseline fallback preserving 2.0g/kg protein.
 */
export function calculateMacroSplit(targetCalories: number, weightKg: number) {
  const safeCals = Math.max(1200, targetCalories);
  const safeWeight = Math.max(40, weightKg);

  const proteinG = Math.round(safeWeight * 2.0);
  const proteinCals = proteinG * 4;

  const fatsCals = Math.round(safeCals * 0.25);
  const fatsG = Math.round(fatsCals / 9);

  const remainingCals = Math.max(0, safeCals - proteinCals - fatsCals);
  const carbsG = Math.round(remainingCals / 4);

  return {
    calories: safeCals,
    protein: proteinG,
    carbs: carbsG,
    fats: fatsG,
  };
}
