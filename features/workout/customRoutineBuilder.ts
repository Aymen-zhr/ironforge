import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogExercise, EXERCISE_CATALOG } from '../../data/exerciseCatalog';
import { resolveExerciseMedia } from '../../services/exerciseMediaService';

export interface CustomExerciseItem {
  id: string; // unique instance id
  exerciseId: string; // catalog exercise id
  name: string;
  targetMuscle: string;
  equipment: string;
  mechanic: 'Compound' | 'Isolation';
  sets: number;
  minReps: number;
  maxReps: number;
  repString: string;
  targetRpe: number;
  restSeconds: number;
  executionCue: string;
  mediaUrl: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  description: string;
  exercises: CustomExerciseItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_CUSTOM_ROUTINES = '@ironforge_custom_routines';

/**
 * Get all saved custom routines from AsyncStorage.
 */
export async function getCustomRoutines(): Promise<CustomRoutine[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ROUTINES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[customRoutineBuilder] Error reading routines:', err);
    return [];
  }
}

/**
 * Save or update a custom routine.
 */
export async function saveCustomRoutine(routine: CustomRoutine): Promise<CustomRoutine[]> {
  const current = await getCustomRoutines();
  const existingIdx = current.findIndex((r) => r.id === routine.id);

  const updatedRoutine: CustomRoutine = {
    ...routine,
    updatedAt: new Date().toISOString(),
  };

  let nextList: CustomRoutine[];
  if (existingIdx >= 0) {
    nextList = [...current];
    nextList[existingIdx] = updatedRoutine;
  } else {
    nextList = [updatedRoutine, ...current];
  }

  await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(nextList));
  return nextList;
}

/**
 * Delete a custom routine by ID.
 */
export async function deleteCustomRoutine(routineId: string): Promise<CustomRoutine[]> {
  const current = await getCustomRoutines();
  const nextList = current.filter((r) => r.id !== routineId);
  await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(nextList));
  return nextList;
}

/**
 * Reorder exercises in a custom routine (e.g., drag and drop / move up/down).
 */
export async function reorderRoutineExercises(
  routineId: string,
  fromIndex: number,
  toIndex: number
): Promise<CustomRoutine | null> {
  const current = await getCustomRoutines();
  const target = current.find((r) => r.id === routineId);
  if (!target) return null;

  const exercises = [...target.exercises];
  if (
    fromIndex < 0 ||
    fromIndex >= exercises.length ||
    toIndex < 0 ||
    toIndex >= exercises.length
  ) {
    return target;
  }

  const [moved] = exercises.splice(fromIndex, 1);
  exercises.splice(toIndex, 0, moved);

  const updated: CustomRoutine = {
    ...target,
    exercises,
    updatedAt: new Date().toISOString(),
  };

  await saveCustomRoutine(updated);
  return updated;
}

/**
 * Helper to convert an exercise catalog item to a CustomExerciseItem.
 */
export function createExerciseItemFromCatalog(catalogEx: CatalogExercise): CustomExerciseItem {
  const media = resolveExerciseMedia(catalogEx.id, catalogEx.name, catalogEx.primaryMuscle);
  const isCompound = catalogEx.mechanic === 'compound';

  return {
    id: `custom-ex-${catalogEx.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    exerciseId: catalogEx.id,
    name: catalogEx.name,
    targetMuscle: catalogEx.primaryMuscle,
    equipment: catalogEx.equipment,
    mechanic: isCompound ? 'Compound' : 'Isolation',
    sets: isCompound ? 4 : 3,
    minReps: isCompound ? 6 : 10,
    maxReps: isCompound ? 10 : 15,
    repString: isCompound ? '6–10 reps' : '10–15 reps',
    targetRpe: 8.5,
    restSeconds: isCompound ? 120 : 60,
    executionCue: catalogEx.instructions && catalogEx.instructions[0]
      ? catalogEx.instructions[0]
      : 'Maintain steady structural control through full active range of motion.',
    mediaUrl: media.gifUrl || media.videoUrl || media.posterUrl || '',
  };
}

/**
 * Search the 876-exercise catalog by query and muscle.
 */
export function searchExerciseCatalog(query: string, muscleFilter?: string): CatalogExercise[] {
  const cleanQ = query.trim().toLowerCase();
  const cleanM = muscleFilter ? muscleFilter.trim().toLowerCase() : '';

  return EXERCISE_CATALOG.filter((ex) => {
    const matchesQ =
      cleanQ.length === 0 ||
      ex.name.toLowerCase().includes(cleanQ) ||
      ex.primaryMuscle.toLowerCase().includes(cleanQ) ||
      ex.equipment.toLowerCase().includes(cleanQ);

    const matchesM =
      !cleanM ||
      cleanM === 'all' ||
      ex.primaryMuscle.toLowerCase().includes(cleanM) ||
      ex.secondaryMuscles.some((m) => m.toLowerCase().includes(cleanM));

    return matchesQ && matchesM;
  }).slice(0, 50);
}
