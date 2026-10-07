import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  isCompleted: boolean;
  isPr?: boolean;
  estimated1Rm: number;
  completedAt?: string;
}

export interface ExerciseRecord {
  exerciseId: string;
  exerciseName?: string;
  targetMuscle?: string;
  bestEstimated1Rm: number;
  lastPerformedDate: string;
  lastSets: {
    weightKg: number;
    reps: number;
  }[];
}

export interface WorkoutSessionRecord {
  id: string;
  splitName: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  prsAchieved: number;
}

const STORAGE_KEY_EXERCISE_HISTORY = '@aegis_exercise_history';
const STORAGE_KEY_WORKOUT_SESSIONS = '@aegis_workout_sessions';

/**
 * Calculates Estimated 1-Rep Max using the Epley Formulation:
 * 1RM = Weight * (1 + Reps / 30)
 * Bounded to realistic physical parameters.
 */
export function calculateEstimated1Rm(weightKg: number, reps: number): number {
  const safeWeight = Math.min(500, Math.max(0, weightKg));
  const safeReps = Math.min(100, Math.max(0, reps));

  if (safeWeight <= 0 || safeReps <= 0) return 0;
  if (safeReps === 1) return Math.round(safeWeight * 10) / 10;

  const raw1Rm = safeWeight * (1 + safeReps / 30);
  return Math.round(raw1Rm * 10) / 10;
}

/**
 * Retrieve all past exercise performance histories.
 */
export async function getExerciseHistories(): Promise<Record<string, ExerciseRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EXERCISE_HISTORY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ExerciseRecord>;
  } catch (err) {
    console.warn('[workoutHistoryService] Error loading exercise histories:', err);
    return {};
  }
}

/**
 * Retrieve performance history for a specific exercise.
 */
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseRecord | null> {
  const all = await getExerciseHistories();
  return all[exerciseId] || null;
}

/**
 * Commit a completed set, calculate 1RM, detect if this set sets a new PR, and update history.
 */
export async function recordSetCompletion(params: {
  exerciseId: string;
  exerciseName: string;
  targetMuscle?: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}): Promise<{ isPr: boolean; estimated1Rm: number; previous1Rm: number }> {
  // Enforce boundary clamping on inputs
  const safeWeight = Math.min(500, Math.max(0, params.weightKg));
  const safeReps = Math.min(100, Math.max(1, params.reps));

  const current1Rm = calculateEstimated1Rm(safeWeight, safeReps);
  const histories = await getExerciseHistories();
  const existing = histories[params.exerciseId];
  const previous1Rm = existing?.bestEstimated1Rm || 0;

  // PR Trigger: current 1RM strictly exceeds historical record
  const isPr = current1Rm > 0 && current1Rm > previous1Rm;
  const newBest1Rm = isPr ? current1Rm : Math.max(previous1Rm, current1Rm);

  // Update or append sets
  const updatedSets = existing ? [...existing.lastSets] : [];
  const setIdx = Math.max(0, params.setNumber - 1);
  updatedSets[setIdx] = { weightKg: safeWeight, reps: safeReps };

  histories[params.exerciseId] = {
    exerciseId: params.exerciseId,
    exerciseName: params.exerciseName || existing?.exerciseName,
    targetMuscle: params.targetMuscle || existing?.targetMuscle,
    bestEstimated1Rm: newBest1Rm,
    lastPerformedDate: new Date().toISOString(),
    lastSets: updatedSets.slice(0, 5), // Keep up to 5 sets
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_EXERCISE_HISTORY, JSON.stringify(histories));
  } catch (err) {
    console.warn('[workoutHistoryService] Error saving exercise history:', err);
  }

  return {
    isPr,
    estimated1Rm: current1Rm,
    previous1Rm,
  };
}

/**
 * Save a complete workout session summary to history.
 */
export async function saveWorkoutSession(session: WorkoutSessionRecord): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKOUT_SESSIONS);
    const existing: WorkoutSessionRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [session, ...existing].slice(0, 50); // Keep last 50 sessions
    await AsyncStorage.setItem(STORAGE_KEY_WORKOUT_SESSIONS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[workoutHistoryService] Error saving workout session:', err);
  }
}

/**
 * Retrieve past workout sessions.
 */
export async function getRecentSessions(): Promise<WorkoutSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKOUT_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSessionRecord[];
  } catch {
    return [];
  }
}

/**
 * Deletes a single workout session by its ID.
 */
export async function deleteWorkoutSession(sessionId: string): Promise<WorkoutSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKOUT_SESSIONS);
    const existing: WorkoutSessionRecord[] = raw ? JSON.parse(raw) : [];
    const updated = existing.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEY_WORKOUT_SESSIONS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Resets all workout and PR history.
 */
export async function clearAllWorkoutHistory(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY_EXERCISE_HISTORY, STORAGE_KEY_WORKOUT_SESSIONS]);
  } catch (err) {
    console.warn('[workoutHistoryService] Error clearing history:', err);
  }
}

/**
 * Computes lifetime metrics across all recorded sessions.
 */
export async function getLifetimeStats(): Promise<{
  totalVolumeKg: number;
  totalSessions: number;
  totalPrs: number;
}> {
  const sessions = await getRecentSessions();
  const totalVolumeKg = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
  const totalSessions = sessions.length;
  const totalPrs = sessions.reduce((sum, s) => sum + (s.prsAchieved || 0), 0);
  return { totalVolumeKg, totalSessions, totalPrs };
}
