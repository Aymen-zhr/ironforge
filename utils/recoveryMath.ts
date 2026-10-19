/**
 * PURE BIOMETRIC RECOVERY MATH // Single Source of Truth
 * Deterministic Neuromuscular Recovery & Muscle Soreness Decay Formula
 * Section 4.D: R(t) = min(100, R_base + (100 - R_base) * (t / T_full)^1.5)
 */

export const RECOVERY_BASE_SCORE = 35; // R_base: 35% immediately following high-volume training
export const T_FULL_SMALL_HOURS = 48; // Biceps, Triceps, Delts, Abs, Calves
export const T_FULL_LARGE_HOURS = 72; // Quads, Hamstrings, Chest/Pectorals, Lats, Glutes

export const LARGE_MUSCLE_SLUGS = new Set([
  'chest',
  'quadriceps',
  'hamstrings',
  'lats',
  'glutes',
  'lower-back',
  'upper-back',
  'trapezius',
]);

/**
 * Determines whether a muscle group requires 72h or 48h for complete neuromuscular recovery.
 */
export function isCompoundLargeMuscle(muscleSlug: string): boolean {
  return LARGE_MUSCLE_SLUGS.has(muscleSlug.toLowerCase());
}

/**
 * Calculates recovery score R(t) for a specific muscle group based on hours elapsed since last trained.
 * @param hoursElapsed Hours elapsed since completion of training session
 * @param isLarge Whether muscle is a large compound group (72h full) or small group (48h full)
 * @param baseScore R_base default is 35%
 * @returns Neuromuscular recovery readiness (0 - 100%)
 */
export function calculateMuscleRecoveryScore(
  hoursElapsed: number,
  isLarge: boolean = false,
  baseScore: number = RECOVERY_BASE_SCORE
): number {
  if (hoursElapsed < 0) return baseScore;
  const tFull = isLarge ? T_FULL_LARGE_HOURS : T_FULL_SMALL_HOURS;
  if (hoursElapsed >= tFull) return 100;

  const timeRatio = Math.min(1.0, hoursElapsed / tFull);
  const recoveryCurve = Math.pow(timeRatio, 1.5);
  const score = baseScore + (100 - baseScore) * recoveryCurve;

  return Math.min(100, Math.round(score * 10) / 10);
}

/**
 * Computes an overall athlete readiness index based on trained muscle states.
 * Returns readiness percentage, category status string, and per-muscle recovery map.
 */
export function calculateAthleteReadiness(
  musclesTrained: { slug: string; hoursAgo: number }[]
): {
  readinessPct: number;
  statusText: 'PRIMED' | 'MODERATE' | 'FATIGUED';
  recoveryMap: Record<string, number>;
} {
  if (!musclesTrained || musclesTrained.length === 0) {
    return {
      readinessPct: 95,
      statusText: 'PRIMED',
      recoveryMap: {},
    };
  }

  const recoveryMap: Record<string, number> = {};
  let totalScore = 0;

  for (const m of musclesTrained) {
    const isLarge = isCompoundLargeMuscle(m.slug);
    const score = calculateMuscleRecoveryScore(m.hoursAgo, isLarge);
    recoveryMap[m.slug] = score;
    totalScore += score;
  }

  const avgReadiness = Math.round(totalScore / musclesTrained.length);

  let statusText: 'PRIMED' | 'MODERATE' | 'FATIGUED' = 'PRIMED';
  if (avgReadiness < 60) {
    statusText = 'FATIGUED';
  } else if (avgReadiness < 80) {
    statusText = 'MODERATE';
  }

  return {
    readinessPct: avgReadiness,
    statusText,
    recoveryMap,
  };
}
