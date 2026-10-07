import rawExercises from './exercises.json';

export type ExerciseMechanic = 'compound' | 'isolation';

export interface CatalogExercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  mechanic: ExerciseMechanic;
  instructions: string[];
}

interface RawExerciseItem {
  id: string;
  name: string;
  force?: string | null;
  level?: string | null;
  mechanic?: string | null;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
}

/**
 * Deterministic mechanic classification if raw field is null/omitted.
 */
function determineMechanic(raw: RawExerciseItem): ExerciseMechanic {
  if (raw.mechanic === 'compound') return 'compound';
  if (raw.mechanic === 'isolation') return 'isolation';

  // Heuristic based on multi-joint patterns and secondary movers
  const hasSecondary = Array.isArray(raw.secondaryMuscles) && raw.secondaryMuscles.length > 0;
  const namePattern = /(press|squat|deadlift|row|pull-up|chin-up|dip|clean|snatch|lunge|thrust|push-up|overhead)/i;

  if (hasSecondary || namePattern.test(raw.name)) {
    return 'compound';
  }
  return 'isolation';
}

/**
 * Complete normalized Free Exercise DB catalog.
 */
export const EXERCISE_CATALOG: CatalogExercise[] = (rawExercises as RawExerciseItem[]).map((e) => {
  const primaryMuscle =
    Array.isArray(e.primaryMuscles) && e.primaryMuscles.length > 0
      ? e.primaryMuscles[0].toLowerCase()
      : 'other';

  const secondaryMuscles = Array.isArray(e.secondaryMuscles)
    ? e.secondaryMuscles.map((m) => m.toLowerCase())
    : [];

  const equipment = e.equipment ? e.equipment.toLowerCase() : 'body only';
  const mechanic = determineMechanic(e);

  const instructions =
    Array.isArray(e.instructions) && e.instructions.length > 0
      ? e.instructions
      : ['Perform movement through full anatomical active range of motion with strict eccentric control.'];

  return {
    id: e.id,
    name: e.name,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    mechanic,
    instructions,
  };
});

/**
 * Muscle group mapping bridge: maps IronForge biometric scan muscle tags
 * to normalized Free Exercise DB muscle identifiers.
 */
export const BIOMETRIC_TO_CATALOG_MUSCLES: Record<string, string[]> = {
  'Upper Chest': ['chest'],
  'Chest': ['chest'],
  'Pectorals': ['chest'],
  'Lateral Delts': ['shoulders'],
  'Rear Delts': ['shoulders'],
  'Delts': ['shoulders'],
  'Deltoids': ['shoulders'],
  'Lats': ['lats', 'middle back'],
  'Lat Width': ['lats', 'middle back'],
  'Biceps': ['biceps', 'forearms'],
  'Triceps': ['triceps'],
  'Arms': ['biceps', 'triceps', 'forearms'],
  'Quads': ['quadriceps'],
  'Hamstrings': ['hamstrings', 'glutes'],
  'Calves': ['calves'],
  'Abs': ['abdominals'],
  'Traps': ['traps', 'middle back'],
  'Back': ['lats', 'middle back', 'traps'],
  'Lower Back': ['lower back'],
};

/**
 * Maps IronForge Split types to target primary muscle groups.
 */
export const SPLIT_TARGET_MUSCLES: Record<string, string[]> = {
  PPL: ['chest', 'shoulders', 'triceps', 'lats', 'middle back', 'biceps', 'quadriceps', 'hamstrings', 'calves'],
  'Upper/Lower': ['chest', 'shoulders', 'lats', 'middle back', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'calves'],
  'Arnold Split': ['chest', 'lats', 'middle back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings'],
  'Full Body': ['chest', 'lats', 'shoulders', 'quadriceps', 'hamstrings', 'biceps', 'triceps', 'abdominals'],
};

/**
 * Filters the catalog based on equipment profile and prioritizes weak points.
 */
export function filterCatalogForWorkout(options: {
  equipment: string;
  weakPoints: string[];
  splitType?: string;
  limit?: number;
}): CatalogExercise[] {
  const { equipment, weakPoints, splitType = 'PPL', limit = 35 } = options;

  // 1. Resolve equipment permissions
  const eqLower = equipment.toLowerCase();
  const allowedEquipments: (rawEq: string) => boolean = (rawEq) => {
    if (eqLower.includes('bodyweight') || eqLower.includes('calisthenic')) {
      return rawEq === 'body only';
    }
    if (eqLower.includes('dumbbell')) {
      return rawEq === 'dumbbell' || rawEq === 'body only' || rawEq === 'bands';
    }
    // Full Commercial Gym allows all equipment
    return true;
  };

  // 2. Resolve weak point target muscles
  const prioritizedMuscles = new Set<string>();
  weakPoints.forEach((wp) => {
    const mapped = BIOMETRIC_TO_CATALOG_MUSCLES[wp] || [wp.toLowerCase()];
    mapped.forEach((m) => prioritizedMuscles.add(m));
  });

  // 3. Resolve general split muscles
  const splitMuscles = new Set<string>(SPLIT_TARGET_MUSCLES[splitType] || ['chest', 'shoulders', 'lats']);

  // Filter exercises matching equipment
  const eligible = EXERCISE_CATALOG.filter((ex) => allowedEquipments(ex.equipment));

  // Partition into:
  // A. Direct Weak Point matches (prioritizing isolation & high-yield compounds)
  const weakPointCandidates: CatalogExercise[] = [];
  // B. General Split candidates
  const generalCandidates: CatalogExercise[] = [];

  eligible.forEach((ex) => {
    const isWeakTarget =
      prioritizedMuscles.has(ex.primaryMuscle) ||
      ex.secondaryMuscles.some((sm) => prioritizedMuscles.has(sm));

    if (isWeakTarget) {
      weakPointCandidates.push(ex);
    } else if (splitMuscles.has(ex.primaryMuscle)) {
      generalCandidates.push(ex);
    }
  });

  // Sort weak point candidates: ensure both isolation and compound options are represented
  const weakPointIsolations = weakPointCandidates.filter((e) => e.mechanic === 'isolation');
  const weakPointCompounds = weakPointCandidates.filter((e) => e.mechanic === 'compound');

  // Interleave and build prioritized candidate pool
  const pool: CatalogExercise[] = [];

  // Add strong weak point isolation and compound exercises first
  const maxWeak = Math.min(20, weakPointCandidates.length);
  for (let i = 0; i < maxWeak; i++) {
    if (i % 2 === 0 && weakPointIsolations[Math.floor(i / 2)]) {
      pool.push(weakPointIsolations[Math.floor(i / 2)]);
    } else if (weakPointCompounds[Math.floor(i / 2)]) {
      pool.push(weakPointCompounds[Math.floor(i / 2)]);
    } else if (weakPointCandidates[i]) {
      pool.push(weakPointCandidates[i]);
    }
  }

  // Fill remaining slots with general split compound and isolation exercises
  for (const ex of generalCandidates) {
    if (pool.length >= limit) break;
    if (!pool.some((p) => p.id === ex.id)) {
      pool.push(ex);
    }
  }

  // Deduplicate and fallback
  const uniquePool = Array.from(new Map(pool.map((e) => [e.id, e])).values());

  return uniquePool.length > 0 ? uniquePool : eligible.slice(0, limit);
}

/**
 * Retrieve a single exercise by ID.
 */
export function getExerciseById(id: string): CatalogExercise | undefined {
  return EXERCISE_CATALOG.find((e) => e.id === id);
}

export default EXERCISE_CATALOG;
