/**
 * PURE BIOMETRIC STRENGTH MATH // Single Source of Truth
 * Deterministic 1RM Estimation Equations: Epley & Brzycki
 */

/**
 * Calculates Estimated 1-Rep Max using the Epley Formulation:
 * 1RM = Weight * (1 + Reps / 30)
 */
export function calculateEpley1Rm(weightKg: number, reps: number): number {
  const safeWeight = Math.min(500, Math.max(0, weightKg));
  const safeReps = Math.min(100, Math.max(0, reps));

  if (safeWeight <= 0 || safeReps <= 0) return 0;
  if (safeReps === 1) return Math.round(safeWeight * 10) / 10;

  const raw1Rm = safeWeight * (1 + safeReps / 30);
  return Math.round(raw1Rm * 10) / 10;
}

/**
 * Calculates Estimated 1-Rep Max using the Brzycki Formulation:
 * 1RM = Weight * (36 / (37 - Reps))
 * Note: Beyond 36 reps, Brzycki degrades asymptomatically, so fallback to Epley.
 */
export function calculateBrzycki1Rm(weightKg: number, reps: number): number {
  const safeWeight = Math.min(500, Math.max(0, weightKg));
  const safeReps = Math.min(36, Math.max(0, reps));

  if (safeWeight <= 0 || safeReps <= 0) return 0;
  if (safeReps === 1) return Math.round(safeWeight * 10) / 10;
  if (safeReps >= 37) return calculateEpley1Rm(safeWeight, safeReps);

  const raw1Rm = safeWeight * (36 / (37 - safeReps));
  return Math.round(raw1Rm * 10) / 10;
}

/**
 * Primary 1RM estimator (Epley baseline with clamped bounds)
 */
export function calculateEstimated1Rm(weightKg: number, reps: number): number {
  return calculateEpley1Rm(weightKg, reps);
}

/**
 * Dual-telemetry 1RM model comparing Epley and Brzycki curves
 */
export function calculate1RmTelemetry(weightKg: number, reps: number) {
  const epley = calculateEpley1Rm(weightKg, reps);
  const brzycki = calculateBrzycki1Rm(weightKg, reps);
  return {
    epley,
    brzycki,
    average: Math.round(((epley + brzycki) / 2) * 10) / 10,
    conservative: Math.min(epley, brzycki),
    aggressive: Math.max(epley, brzycki),
  };
}

/**
 * Composite 1RM average of Epley and Brzycki (as specified in Section 4.B)
 */
export function calculateComposite1Rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  const epley = calculateEpley1Rm(weightKg, reps);
  const brzycki = calculateBrzycki1Rm(weightKg, reps);
  return Math.round(((epley + brzycki) / 2) * 10) / 10;
}

/**
 * Calculates official Powerlifting DOTS Score for relative strength comparison.
 * Total = Bench + Squat + Deadlift (kg), bodyweightKg, gender.
 */
export function calculateDotsScore(
  totalLiftedKg: number,
  bodyweightKg: number,
  gender: 'male' | 'female' = 'male'
): number {
  if (totalLiftedKg <= 0 || bodyweightKg <= 30) return 0;

  const bw = Math.min(210, Math.max(40, bodyweightKg));
  let denominator = 0;

  if (gender === 'male') {
    // Official IPF male coefficients
    const c0 = -307.275;
    const c1 = 24.0900756;
    const c2 = -0.1918759221;
    const c3 = 0.0007391293;
    const c4 = -0.000001093;
    denominator = c0 + c1 * bw + c2 * Math.pow(bw, 2) + c3 * Math.pow(bw, 3) + c4 * Math.pow(bw, 4);
  } else {
    // Official IPF female coefficients
    const c0 = -57.96288;
    const c1 = 13.6175032;
    const c2 = -0.1126655495;
    const c3 = 0.0005158568;
    const c4 = -0.0000010706;
    denominator = c0 + c1 * bw + c2 * Math.pow(bw, 2) + c3 * Math.pow(bw, 3) + c4 * Math.pow(bw, 4);
  }

  if (denominator <= 0) return 0;
  const dots = (totalLiftedKg / denominator) * 500;
  return Math.round(dots * 10) / 10;
}
