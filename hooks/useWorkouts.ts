import { useState, useEffect, useCallback } from 'react';
import { db, expoDb } from '../db/client';
import { workouts, workoutSets, Workout, WorkoutSet, InsertWorkout, InsertWorkoutSet } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export function useWorkouts() {
  const [workoutList, setWorkoutList] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const rows = await db
          .select()
          .from(workouts)
          .orderBy(desc(workouts.start_time));

        if (!isCancelled) {
          setWorkoutList(rows);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[useWorkouts] Query error:', err);
        if (!isCancelled) {
          setError(err?.message || 'Failed to query local workouts');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  const getWorkoutWithSets = useCallback(async (workoutId: string): Promise<{
    workout: Workout;
    sets: WorkoutSet[];
  } | null> => {
    try {
      const foundWorkout = await db
        .select()
        .from(workouts)
        .where(eq(workouts.id, workoutId))
        .limit(1);

      if (!foundWorkout[0]) return null;

      const sets = await db
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.workout_id, workoutId))
        .orderBy(workoutSets.set_number);

      return {
        workout: foundWorkout[0],
        sets,
      };
    } catch (err) {
      console.warn('[useWorkouts] Error loading workout sets:', err);
      return null;
    }
  }, []);

  const saveWorkout = useCallback(
    async (newWorkout: InsertWorkout, sets: InsertWorkoutSet[]): Promise<void> => {
      expoDb.withTransactionSync(() => {
        const wStmt = expoDb.prepareSync(`
          INSERT OR REPLACE INTO workouts (id, name, start_time, end_time, volume_load, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        try {
          wStmt.executeSync([
            newWorkout.id,
            newWorkout.name,
            newWorkout.start_time,
            newWorkout.end_time ?? null,
            newWorkout.volume_load ?? 0,
            newWorkout.notes ?? null,
          ]);
        } finally {
          wStmt.finalizeSync();
        }

        const wsStmt = expoDb.prepareSync(`
          INSERT OR REPLACE INTO workout_sets (
            id, workout_id, exercise_id, set_number, weight, reps, rpe, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        try {
          for (const s of sets) {
            wsStmt.executeSync([
              s.id,
              s.workout_id,
              s.exercise_id,
              s.set_number,
              s.weight,
              s.reps,
              s.rpe ?? null,
              s.completed_at ?? null,
            ]);
          }
        } finally {
          wsStmt.finalizeSync();
        }
      });

      refetch();
    },
    [refetch]
  );

  const deleteWorkout = useCallback(
    async (workoutId: string): Promise<void> => {
      try {
        await db.delete(workouts).where(eq(workouts.id, workoutId));
        refetch();
      } catch (err) {
        console.warn('[useWorkouts] Error deleting workout:', err);
      }
    },
    [refetch]
  );

  return {
    workouts: workoutList,
    loading,
    error,
    refresh: refetch,
    getWorkoutWithSets,
    saveWorkout,
    deleteWorkout,
    totalWorkouts: workoutList.length,
  };
}

export default useWorkouts;
