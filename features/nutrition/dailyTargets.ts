/**
 * DAILY TARGETS TELEMETRY
 * Compares actual daily totals directly against user-configured macro targets
 * with deterministic math and progress bar metrics.
 */

export interface MacroTargetComparison {
  name: 'Calories' | 'Protein' | 'Carbs' | 'Fats';
  unit: 'kcal' | 'g';
  consumed: number;
  target: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  barColor: string;
  statusText: string;
}

export interface DailyTargetsSummary {
  calories: MacroTargetComparison;
  protein: MacroTargetComparison;
  carbs: MacroTargetComparison;
  fats: MacroTargetComparison;
  water: {
    consumedMl: number;
    targetMl: number;
    percentage: number;
    remainingMl: number;
  };
  overallAdherencePct: number;
}

export function evaluateDailyTargets(params: {
  consumedCalories: number;
  targetCalories: number;
  consumedProtein: number;
  targetProtein: number;
  consumedCarbs: number;
  targetCarbs: number;
  consumedFats: number;
  targetFats: number;
  consumedWaterMl?: number;
  targetWaterMl?: number;
}): DailyTargetsSummary {
  const {
    consumedCalories,
    targetCalories,
    consumedProtein,
    targetProtein,
    consumedCarbs,
    targetCarbs,
    consumedFats,
    targetFats,
    consumedWaterMl = 0,
    targetWaterMl = 3500,
  } = params;

  const buildComparison = (
    name: 'Calories' | 'Protein' | 'Carbs' | 'Fats',
    unit: 'kcal' | 'g',
    consumed: number,
    target: number,
    baseColor: string
  ): MacroTargetComparison => {
    const safeTarget = Math.max(1, target);
    const safeConsumed = Math.max(0, consumed);
    const percentage = Math.min(200, Math.round((safeConsumed / safeTarget) * 100));
    const remaining = safeTarget - safeConsumed;
    const isExceeded = safeConsumed > safeTarget;

    let barColor = baseColor;
    let statusText = `${remaining > 0 ? `${remaining}${unit} left` : `${Math.abs(remaining)}${unit} over`}`;

    if (percentage >= 95 && percentage <= 105) {
      statusText = 'ON TARGET';
      barColor = '#10E760';
    } else if (isExceeded) {
      barColor = '#FF5A1F';
    }

    return {
      name,
      unit,
      consumed: safeConsumed,
      target: safeTarget,
      remaining,
      percentage,
      isExceeded,
      barColor,
      statusText,
    };
  };

  const calories = buildComparison('Calories', 'kcal', consumedCalories, targetCalories, '#FF5A1F');
  const protein = buildComparison('Protein', 'g', consumedProtein, targetProtein, '#10E760');
  const carbs = buildComparison('Carbs', 'g', consumedCarbs, targetCarbs, '#00D2FF');
  const fats = buildComparison('Fats', 'g', consumedFats, targetFats, '#FF9F0A');

  const safeWaterTarget = Math.max(1, targetWaterMl);
  const waterPct = Math.min(100, Math.round((consumedWaterMl / safeWaterTarget) * 100));
  const waterRemaining = Math.max(0, safeWaterTarget - consumedWaterMl);

  // Adherence score
  const macroAdherence = (
    Math.min(100, (consumedCalories / Math.max(1, targetCalories)) * 100) +
    Math.min(100, (consumedProtein / Math.max(1, targetProtein)) * 100) +
    Math.min(100, (consumedCarbs / Math.max(1, targetCarbs)) * 100) +
    Math.min(100, (consumedFats / Math.max(1, targetFats)) * 100)
  ) / 4;

  return {
    calories,
    protein,
    carbs,
    fats,
    water: {
      consumedMl: consumedWaterMl,
      targetMl: safeWaterTarget,
      percentage: waterPct,
      remainingMl: waterRemaining,
    },
    overallAdherencePct: Math.round(macroAdherence),
  };
}
