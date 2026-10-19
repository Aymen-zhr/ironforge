import type { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';

export type { Slug, ExtendedBodyPart };

/**
 * Normalizes any muscle string into canonical lowercase tokens.
 */
function cleanMuscleString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[–—_]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\- ]+/g, ' ')
    .trim();
}

/**
 * Direct lookup map from common database / catalog muscle strings to Body Highlighter Slug.
 */
export const MUSCLE_NAME_TO_SLUG: Record<string, Slug> = {
  // Chest
  chest: 'chest',
  pectorals: 'chest',
  pectoralis: 'chest',
  'pectoralis major': 'chest',
  'sternal pectoralis major': 'chest',
  'clavicular pectoralis major': 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',
  pecs: 'chest',

  // Deltoids / Shoulders
  shoulders: 'deltoids',
  deltoids: 'deltoids',
  delts: 'deltoids',
  'anterior deltoid': 'deltoids',
  'lateral deltoid': 'deltoids',
  'posterior deltoid': 'deltoids',
  'side delts': 'deltoids',
  'rear delts': 'deltoids',
  'front delts': 'deltoids',
  'rotator cuff': 'deltoids',

  // Biceps
  biceps: 'biceps',
  'biceps brachii': 'biceps',
  'biceps brachii long head': 'biceps',
  'biceps brachii short head': 'biceps',
  brachialis: 'biceps',

  // Triceps
  triceps: 'triceps',
  'triceps brachii': 'triceps',
  'triceps lateral and medial head': 'triceps',
  'triceps long head': 'triceps',

  // Forearms
  forearms: 'forearm',
  forearm: 'forearm',
  wrists: 'forearm',
  brachioradialis: 'forearm',

  // Back / Lats / Rhomboids
  lats: 'upper-back',
  'latissimus dorsi': 'upper-back',
  latissimus: 'upper-back',
  back: 'upper-back',
  'upper back': 'upper-back',
  'middle back': 'upper-back',
  'mid-back': 'upper-back',
  'mid back': 'upper-back',
  rhomboids: 'upper-back',
  'posterior chain': 'upper-back',

  // Traps
  traps: 'trapezius',
  trapezius: 'trapezius',
  'upper traps': 'trapezius',

  // Lower Back
  'lower back': 'lower-back',
  'lower-back': 'lower-back',
  'erector spinae': 'lower-back',
  lumbar: 'lower-back',

  // Abs / Core
  abdominals: 'abs',
  abs: 'abs',
  core: 'abs',
  'rectus abdominis': 'abs',
  'transverse abdominis': 'abs',

  // Obliques
  obliques: 'obliques',
  'internal obliques': 'obliques',
  'external obliques': 'obliques',
  waist: 'obliques',

  // Quads
  quadriceps: 'quadriceps',
  quads: 'quadriceps',
  'vastus medialis': 'quadriceps',
  'vastus lateralis': 'quadriceps',
  'rectus femoris': 'quadriceps',
  legs: 'quadriceps',

  // Hamstrings
  hamstrings: 'hamstring',
  hamstring: 'hamstring',
  'biceps femoris': 'hamstring',
  semitendinosus: 'hamstring',
  semimembranosus: 'hamstring',

  // Glutes
  glutes: 'gluteal',
  gluteal: 'gluteal',
  'gluteus maximus': 'gluteal',
  'gluteus medius': 'gluteal',
  'gluteal fold': 'gluteal',
  hips: 'gluteal',
  abductors: 'gluteal',

  // Calves
  calves: 'calves',
  calf: 'calves',
  gastrocnemius: 'calves',
  soleus: 'calves',

  // Adductors
  adductors: 'adductors',
  groin: 'adductors',
  'inner thigh': 'adductors',

  // Tibialis & Neck
  tibialis: 'tibialis',
  'tibialis anterior': 'tibialis',
  shins: 'tibialis',
  neck: 'neck',
};

/**
 * Mapping of Body Highlighter Slug to search keywords used in database exercise queries.
 */
export const SLUG_TO_SEARCH_KEYWORDS: Record<Slug, string[]> = {
  chest: ['chest', 'pectorals', 'pectoralis', 'pecs'],
  deltoids: ['shoulders', 'deltoids', 'delts', 'rotator cuff'],
  biceps: ['biceps', 'brachialis'],
  triceps: ['triceps'],
  forearm: ['forearms', 'forearm', 'wrist'],
  'upper-back': ['lats', 'latissimus', 'middle back', 'upper back', 'rhomboids', 'back'],
  'lower-back': ['lower back', 'erector spinae', 'lumbar'],
  trapezius: ['traps', 'trapezius'],
  abs: ['abdominals', 'abs', 'core'],
  obliques: ['obliques'],
  quadriceps: ['quadriceps', 'quads', 'vastus'],
  hamstring: ['hamstrings', 'hamstring'],
  gluteal: ['glutes', 'gluteal', 'abductors'],
  calves: ['calves', 'calf', 'gastrocnemius', 'soleus'],
  adductors: ['adductors', 'groin'],
  tibialis: ['tibialis', 'shins'],
  neck: ['neck'],
  ankles: ['ankles'],
  feet: ['feet'],
  hands: ['hands'],
  hair: ['hair'],
  head: ['head'],
  knees: ['knees'],
};

/**
 * Human-friendly labels for UI presentation.
 */
export const SLUG_DISPLAY_NAMES: Record<Slug, string> = {
  chest: 'Chest',
  deltoids: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Forearms',
  'upper-back': 'Lats & Upper Back',
  'lower-back': 'Lower Back',
  trapezius: 'Traps',
  abs: 'Abs & Core',
  obliques: 'Obliques',
  quadriceps: 'Quads',
  hamstring: 'Hamstrings',
  gluteal: 'Glutes',
  calves: 'Calves',
  adductors: 'Adductors',
  tibialis: 'Tibialis',
  neck: 'Neck',
  ankles: 'Ankles',
  feet: 'Feet',
  hands: 'Hands',
  hair: 'Head',
  head: 'Head',
  knees: 'Knees',
};

/**
 * Indicates which side of the body a muscle group is primarily visible on.
 */
export const SLUG_PERSPECTIVES: Record<Slug, 'front' | 'back' | 'both'> = {
  chest: 'front',
  abs: 'front',
  obliques: 'front',
  biceps: 'front',
  quadriceps: 'front',
  adductors: 'front',
  tibialis: 'front',
  'upper-back': 'back',
  'lower-back': 'back',
  trapezius: 'back',
  triceps: 'back',
  gluteal: 'back',
  hamstring: 'back',
  calves: 'back',
  deltoids: 'both',
  forearm: 'both',
  neck: 'both',
  ankles: 'both',
  feet: 'both',
  hands: 'both',
  hair: 'back',
  head: 'front',
  knees: 'front',
};

/**
 * Maps a single muscle string to a Slug.
 */
export function getMuscleSlug(rawMuscle?: string | null): Slug | null {
  if (!rawMuscle || typeof rawMuscle !== 'string') return null;
  const cleaned = cleanMuscleString(rawMuscle);
  if (!cleaned) return null;

  // Direct lookup
  if (MUSCLE_NAME_TO_SLUG[cleaned]) {
    return MUSCLE_NAME_TO_SLUG[cleaned];
  }

  // Pattern checks
  if (cleaned.includes('chest') || cleaned.includes('pec')) return 'chest';
  if (cleaned.includes('delt') || cleaned.includes('shoulder')) return 'deltoids';
  if (cleaned.includes('bicep')) return 'biceps';
  if (cleaned.includes('tricep')) return 'triceps';
  if (cleaned.includes('forearm') || cleaned.includes('wrist')) return 'forearm';
  if (cleaned.includes('quad') || cleaned.includes('vastus')) return 'quadriceps';
  if (cleaned.includes('hamstring') || cleaned.includes('femoris')) return 'hamstring';
  if (cleaned.includes('glute')) return 'gluteal';
  if (cleaned.includes('calf') || cleaned.includes('calve') || cleaned.includes('soleus') || cleaned.includes('gastrocnemius')) return 'calves';
  if (cleaned.includes('lat') || cleaned.includes('rhomboid') || cleaned.includes('mid-back') || cleaned.includes('upper back') || cleaned.includes('middle back')) return 'upper-back';
  if (cleaned.includes('lower back') || cleaned.includes('erector')) return 'lower-back';
  if (cleaned.includes('trap')) return 'trapezius';
  if (cleaned.includes('abdom') || cleaned.includes('core') || cleaned.includes('abs')) return 'abs';
  if (cleaned.includes('oblique')) return 'obliques';
  if (cleaned.includes('adduct') || cleaned.includes('groin')) return 'adductors';
  if (cleaned.includes('abduct')) return 'gluteal';
  if (cleaned.includes('tibialis') || cleaned.includes('shin')) return 'tibialis';
  if (cleaned.includes('neck')) return 'neck';

  return null;
}

/**
 * Resolves all distinct slugs for an exercise's primary and secondary muscles.
 */
export function getExerciseMuscleSlugs(exercise: {
  primary_muscle?: string | null;
  secondary_muscles?: string[] | null;
  primaryMuscle?: string | null;
  secondaryMuscles?: string[] | null;
  targetMuscle?: string | null;
}): { primarySlugs: Slug[]; secondarySlugs: Slug[] } {
  const primaryRaw = exercise.primary_muscle || exercise.primaryMuscle || exercise.targetMuscle;
  const secondaryRaw = exercise.secondary_muscles || exercise.secondaryMuscles || [];

  const primarySlugs: Slug[] = [];
  const secondarySlugs: Slug[] = [];

  // Parse compound strings like "Chest & Triceps" or "Quadriceps & Gluteus Maximus"
  if (primaryRaw) {
    const parts = primaryRaw.split(/[,/&+]|\band\b/i);
    for (const part of parts) {
      const slug = getMuscleSlug(part);
      if (slug && !primarySlugs.includes(slug)) {
        primarySlugs.push(slug);
      }
    }
  }

  for (const item of secondaryRaw) {
    if (!item) continue;
    const parts = item.split(/[,/&+]|\band\b/i);
    for (const part of parts) {
      const slug = getMuscleSlug(part);
      if (slug && !primarySlugs.includes(slug) && !secondarySlugs.includes(slug)) {
        secondarySlugs.push(slug);
      }
    }
  }

  return { primarySlugs, secondarySlugs };
}

export interface SetVolumeData {
  weight?: string | number | null;
  reps?: string | number | null;
  isCompleted?: boolean;
}

export interface ExerciseVolumeItem {
  id?: string;
  name?: string;
  primary_muscle?: string | null;
  secondary_muscles?: string[] | null;
  primaryMuscle?: string | null;
  secondaryMuscles?: string[] | null;
  targetMuscle?: string | null;
  sets?: SetVolumeData[] | number | null;
  minReps?: number | null;
  maxReps?: number | null;
}

/**
 * Calculates raw session volume load (kg x reps) grouped by Body Highlighter Slug.
 * Primary movers take 100% volume; secondary movers take 50% volume.
 */
export function calculateVolumeLoadByMuscle(
  exercises: ExerciseVolumeItem[]
): Record<Slug, number> {
  const volumeMap: Partial<Record<Slug, number>> = {};

  for (const ex of exercises) {
    const { primarySlugs, secondarySlugs } = getExerciseMuscleSlugs(ex);
    if (primarySlugs.length === 0 && secondarySlugs.length === 0) continue;

    let exVolume = 0;

    if (Array.isArray(ex.sets) && ex.sets.length > 0) {
      // Calculate from set logs
      for (const set of ex.sets) {
        // If isCompleted is explicitly false, skip; if undefined or true, include
        if (set.isCompleted === false) continue;
        const w = Math.max(0, parseFloat(String(set.weight || '0')) || 0);
        const r = Math.max(0, parseInt(String(set.reps || '0'), 10) || 0);
        // If bodyweight exercise with 0 weight, use 1kg baseline or effective reps
        const setLoad = w > 0 ? w * r : r * 15;
        exVolume += setLoad;
      }
      // If completed sets were empty, calculate fallback based on scheduled sets
      if (exVolume === 0) {
        const avgReps = ((ex.minReps || 8) + (ex.maxReps || 12)) / 2;
        exVolume = ex.sets.length * avgReps * 40;
      }
    } else {
      // Preview mode: based on set count and rep ranges
      const setCount = typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 3;
      const avgReps = ((ex.minReps || 8) + (ex.maxReps || 12)) / 2;
      exVolume = setCount * avgReps * 50; // standard baseline load
    }

    if (exVolume <= 0) continue;

    // Distribute among primary muscles
    for (const slug of primarySlugs) {
      volumeMap[slug] = (volumeMap[slug] || 0) + exVolume;
    }

    // Distribute among secondary muscles (50% weight)
    for (const slug of secondarySlugs) {
      volumeMap[slug] = (volumeMap[slug] || 0) + exVolume * 0.5;
    }
  }

  return volumeMap as Record<Slug, number>;
}

/**
 * Computes heatmap data for react-native-body-highlighter.
 * Returns ExtendedBodyPart[] with intensity values:
 * 1 = Low intensity (volume > 0)
 * 2 = Moderate intensity (volume >= 40% max)
 * 3 = High/Peak intensity (volume >= 75% max)
 */
export function computeHeatmapData(
  exercises: ExerciseVolumeItem[],
  options?: {
    maxIntensityLevel?: number; // default 3
    selectedSlug?: Slug | null;
    selectedColor?: string;
  }
): ExtendedBodyPart[] {
  const maxLevels = options?.maxIntensityLevel || 3;
  const volumeMap = calculateVolumeLoadByMuscle(exercises);
  const slugs = Object.keys(volumeMap) as Slug[];

  if (slugs.length === 0) {
    // If selectedSlug is passed even with 0 volume, highlight it
    if (options?.selectedSlug) {
      return [
        {
          slug: options.selectedSlug,
          intensity: maxLevels,
          color: options.selectedColor,
        },
      ];
    }
    return [];
  }

  let maxVol = 0;
  for (const slug of slugs) {
    const vol = volumeMap[slug] || 0;
    if (vol > maxVol) maxVol = vol;
  }

  const result: ExtendedBodyPart[] = [];

  for (const slug of slugs) {
    const vol = volumeMap[slug] || 0;
    if (vol <= 0) continue;

    let intensity = 1;
    const ratio = maxVol > 0 ? vol / maxVol : 0;

    if (maxLevels >= 3) {
      if (ratio >= 0.75) {
        intensity = 3;
      } else if (ratio >= 0.4) {
        intensity = 2;
      } else {
        intensity = 1;
      }
    } else {
      intensity = ratio >= 0.5 ? 2 : 1;
    }

    const isSelected = options?.selectedSlug === slug;

    result.push({
      slug,
      intensity,
      color: isSelected && options?.selectedColor ? options.selectedColor : undefined,
    });
  }

  // Ensure selected slug is in the array
  if (options?.selectedSlug && !result.some((r) => r.slug === options.selectedSlug)) {
    result.push({
      slug: options.selectedSlug,
      intensity: maxLevels,
      color: options.selectedColor,
    });
  }

  return result;
}

/**
 * Filter a list of exercises by a given muscle slug.
 */
export function filterExercisesByMuscleSlug<
  T extends {
    primary_muscle?: string | null;
    secondary_muscles?: string[] | null;
    primaryMuscle?: string | null;
    secondaryMuscles?: string[] | null;
    targetMuscle?: string | null;
    name?: string;
  }
>(exercises: T[], slug: Slug): T[] {
  const targetKeywords = SLUG_TO_SEARCH_KEYWORDS[slug] || [slug];

  return exercises.filter((ex) => {
    const { primarySlugs, secondarySlugs } = getExerciseMuscleSlugs(ex);
    if (primarySlugs.includes(slug) || secondarySlugs.includes(slug)) {
      return true;
    }

    // Direct text fallback matching
    const primaryText = cleanMuscleString(
      ex.primary_muscle || ex.primaryMuscle || ex.targetMuscle || ''
    );
    const secondaryList = (ex.secondary_muscles || ex.secondaryMuscles || []).map(cleanMuscleString);

    for (const kw of targetKeywords) {
      if (primaryText.includes(kw)) return true;
      if (secondaryList.some((s) => s.includes(kw))) return true;
    }

    return false;
  });
}
