/**
 * DETERMINISTIC PROGRESSIVE OVERLOAD ENGINE
 * Calculates targets using standard progressive overload math:
 * e.g., add 2.5kg when hitting the top rep range for 2 consecutive sessions.
 */

export interface ExerciseSessionPerformance {
  date: string;
  weightKg: number;
  reps: number;
  setsCompleted: number;
  hitTopRepRange: boolean;
}

export interface OverloadRecommendation {
  action: 'OVERLOAD_INCREASE' | 'MAINTAIN_TARGET' | 'MICRO_ADJUST';
  currentWeightKg: number;
  recommendedWeightKg: number;
  weightDeltaKg: number;
  recommendedMinReps: number;
  recommendedMaxReps: number;
  consecutiveTopHits: number;
  reason: string;
  badgeLabel: string;
  badgeColor: string;
}

export interface OverloadConfig {
  exerciseId: string;
  mechanic: 'Compound' | 'Isolation';
  targetMuscle?: string;
  minReps: number;
  maxReps: number;
  recentSessions: ExerciseSessionPerformance[];
}

/**
 * Evaluates whether an exercise qualifies for progressive overload.
 * Rule: Add 2.5kg (or 5.0kg for lower compounds, 1.25kg for isolations)
 * when hitting the top rep range for 2 consecutive sessions.
 */
export function calculateProgressiveOverload(config: OverloadConfig): OverloadRecommendation {
  const { mechanic, targetMuscle = '', minReps, maxReps, recentSessions } = config;

  // Determine standard overload increment
  const isLowerChain =
    targetMuscle.toLowerCase().includes('quad') ||
    targetMuscle.toLowerCase().includes('hamstring') ||
    targetMuscle.toLowerCase().includes('glute') ||
    targetMuscle.toLowerCase().includes('leg');

  let defaultIncrement = 2.5;
  if (mechanic === 'Compound' && isLowerChain) {
    defaultIncrement = 5.0; // Squat & Deadlift progression
  } else if (mechanic === 'Isolation') {
    defaultIncrement = 1.25; // Lateral raises, curls, extensions
  }

  if (!recentSessions || recentSessions.length === 0) {
    return {
      action: 'MAINTAIN_TARGET',
      currentWeightKg: 0,
      recommendedWeightKg: 0,
      weightDeltaKg: 0,
      recommendedMinReps: minReps,
      recommendedMaxReps: maxReps,
      consecutiveTopHits: 0,
      reason: `Establish baseline: Target ${minReps}–${maxReps} reps with strict structural control.`,
      badgeLabel: 'BASELINE',
      badgeColor: '#94A3B8',
    };
  }

  const latest = recentSessions[0];
  const currentWeight = latest.weightKg;

  // Count consecutive sessions hitting top rep range
  let consecutiveHits = 0;
  for (const session of recentSessions) {
    if (session.hitTopRepRange || session.reps >= maxReps) {
      consecutiveHits++;
    } else {
      break;
    }
  }

  // 1. Condition Met: 2 or more consecutive sessions hitting top rep bracket
  if (consecutiveHits >= 2) {
    const nextWeight = Math.round((currentWeight + defaultIncrement) * 10) / 10;
    return {
      action: 'OVERLOAD_INCREASE',
      currentWeightKg: currentWeight,
      recommendedWeightKg: nextWeight,
      weightDeltaKg: defaultIncrement,
      recommendedMinReps: minReps,
      recommendedMaxReps: maxReps,
      consecutiveTopHits: consecutiveHits,
      reason: `Target hit for ${consecutiveHits} straight sessions (≥${maxReps} reps). Add +${defaultIncrement}kg next session!`,
      badgeLabel: `+${defaultIncrement}KG OVERLOAD`,
      badgeColor: '#10E760',
    };
  }

  // 2. Condition Pending: Hit top reps once
  if (consecutiveHits === 1) {
    return {
      action: 'MAINTAIN_TARGET',
      currentWeightKg: currentWeight,
      recommendedWeightKg: currentWeight,
      weightDeltaKg: 0,
      recommendedMinReps: minReps,
      recommendedMaxReps: maxReps,
      consecutiveTopHits: 1,
      reason: `Hit top of bracket (${latest.reps} reps). Repeat at ${currentWeight}kg today to unlock +${defaultIncrement}kg overload!`,
      badgeLabel: '1/2 TO OVERLOAD',
      badgeColor: '#00D2FF',
    };
  }

  // 3. Sub-bracket performance
  const avgReps = latest.reps;
  return {
    action: 'MAINTAIN_TARGET',
    currentWeightKg: currentWeight,
    recommendedWeightKg: currentWeight,
    weightDeltaKg: 0,
    recommendedMinReps: minReps,
    recommendedMaxReps: maxReps,
    consecutiveTopHits: 0,
    reason: `Currently at ${avgReps} reps. Accumulate volume toward ${maxReps} reps before increasing load.`,
    badgeLabel: `${avgReps}/${maxReps} REPS`,
    badgeColor: '#FF9F0A',
  };
}
