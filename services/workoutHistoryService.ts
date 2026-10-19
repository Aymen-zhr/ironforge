import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateEpley1Rm,
  calculateBrzycki1Rm,
  calculateEstimated1Rm,
  calculate1RmTelemetry,
} from '../utils/strengthMath';

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

const STORAGE_KEY_EXERCISE_HISTORY = '@ironforge_exercise_history';
const STORAGE_KEY_WORKOUT_SESSIONS = '@ironforge_workout_sessions';

export {
  calculateEpley1Rm,
  calculateBrzycki1Rm,
  calculateEstimated1Rm,
  calculate1RmTelemetry,
};

/**
 * Retrieve all past exercise performance histories.
 */
export async function getExerciseHistories(): Promise<Record<string, ExerciseRecord>> {
  try {
    const raw =
      (await AsyncStorage.getItem(STORAGE_KEY_EXERCISE_HISTORY)) ||
      (await AsyncStorage.getItem('@aegis_exercise_history'));
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
    const raw =
      (await AsyncStorage.getItem(STORAGE_KEY_WORKOUT_SESSIONS)) ||
      (await AsyncStorage.getItem('@aegis_workout_sessions'));
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
    await AsyncStorage.multiRemove([
      STORAGE_KEY_EXERCISE_HISTORY,
      STORAGE_KEY_WORKOUT_SESSIONS,
      '@aegis_exercise_history',
      '@aegis_workout_sessions',
    ]);
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
