/**
 * OLYMPIC BARBELL PLATE LOADING CALCULATOR // Single Source of Truth
 * Deterministic loading math for 20kg / 15kg bars using standard IWF denominations.
 */

// Standard Olympic plate denominations in KG
export const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export type PlateWeight = typeof STANDARD_PLATES[number];

export interface PlateResult {
  weight: number;
  count: number;
  color: string;
  heightPx: number;
}

export interface BarbellLoadingPlan {
  targetWeightKg: number;
  barWeightKg: number;
  weightPerSideKg: number;
  platesPerSleeve: PlateResult[];
  remainderKg: number;
  isExact: boolean;
  totalLoadedWeightKg: number;
}

/**
 * Standard IWF Olympic plate color-coding
 */
export function getPlateColor(weight: number): string {
  switch (weight) {
    case 25: return '#E11D48'; // Red (25kg)
    case 20: return '#0A84FF'; // Blue (20kg)
    case 15: return '#EAB308'; // Yellow (15kg)
    case 10: return '#30D158'; // Green (10kg)
    case 5: return '#FFFFFF';  // White (5kg)
    case 2.5: return '#94A3B8'; // Silver (2.5kg)
    case 1.25: return '#64748B'; // Gray (1.25kg)
    default: return '#64748B';
  }
}

export function getPlateHeight(weight: number): number {
  switch (weight) {
    case 25: return 56;
    case 20: return 52;
    case 15: return 46;
    case 10: return 40;
    case 5: return 32;
    case 2.5: return 26;
    case 1.25: return 20;
    default: return 22;
  }
}

/**
 * Exact math for loading 20kg / 15kg bars using standard plate denominations.
 */
export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20
): BarbellLoadingPlan {
  const safeTarget = Math.max(barWeightKg, targetWeightKg);
  const neededWeight = safeTarget - barWeightKg;
  let remainingPerSide = neededWeight / 2;

  const platesPerSleeve: PlateResult[] = [];

  for (const plate of STANDARD_PLATES) {
    if (remainingPerSide >= plate) {
      const count = Math.floor(remainingPerSide / plate);
      remainingPerSide = Math.round((remainingPerSide - count * plate) * 100) / 100;
      platesPerSleeve.push({
        weight: plate,
        count,
        color: getPlateColor(plate),
        heightPx: getPlateHeight(plate),
      });
    }
  }

  const remainderKg = Math.round(remainingPerSide * 2 * 100) / 100;
  const isExact = remainderKg === 0;
  const totalLoadedWeightKg = safeTarget - remainderKg;

  return {
    targetWeightKg: safeTarget,
    barWeightKg,
    weightPerSideKg: (safeTarget - barWeightKg) / 2,
    platesPerSleeve,
    remainderKg,
    isExact,
    totalLoadedWeightKg,
  };
}
