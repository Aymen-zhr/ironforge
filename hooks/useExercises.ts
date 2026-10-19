import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/client';
import { exercises, Exercise, InsertExercise } from '../db/schema';
import { eq } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from '../db/seed';

export interface UseExercisesOptions {
  searchQuery?: string;
  muscleFilter?: string;
  limit?: number;
}

export function useExercises(options?: UseExercisesOptions) {
  const searchQuery = options?.searchQuery;
  const muscleFilter = options?.muscleFilter;
  const limit = options?.limit;

  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
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
        // Ensure database is initialized & seeded
        await seedDatabaseIfEmpty();

        const query = db.select().from(exercises);
        const all = await query;

        let filtered = all;

        if (searchQuery && searchQuery.trim().length > 0) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(
            (ex: Exercise) =>
              ex.name.toLowerCase().includes(q) ||
              ex.primary_muscle.toLowerCase().includes(q) ||
              (ex.equipment && ex.equipment.toLowerCase().includes(q))
          );
        }

        if (muscleFilter && muscleFilter !== 'all') {
          const m = muscleFilter.trim().toLowerCase();
          filtered = filtered.filter((ex: Exercise) => {
            if (ex.primary_muscle.toLowerCase() === m) return true;
            if (ex.secondary_muscles) {
              try {
                const secondary: string[] = JSON.parse(ex.secondary_muscles);
                if (secondary.some((s) => s.toLowerCase() === m)) return true;
              } catch {}
            }
            return false;
          });
        }

        if (limit && limit > 0) {
          filtered = filtered.slice(0, limit);
        }

        if (!isCancelled) {
          setExerciseList(filtered);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[useExercises] Error loading exercises:', err);
        if (!isCancelled) {
          setError(err?.message || 'Failed to query local exercises');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, muscleFilter, limit, refreshTrigger]);

  const getExerciseById = useCallback(async (id: string): Promise<Exercise | null> => {
    try {
      const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
      return rows[0] || null;
    } catch (err) {
      console.warn('[useExercises] Error fetching exercise by ID:', err);
      return null;
    }
  }, []);

  const addExercise = useCallback(
    async (newEx: InsertExercise) => {
      await db.insert(exercises).values(newEx).onConflictDoUpdate({
        target: exercises.id,
        set: newEx,
      });
      refetch();
    },
    [refetch]
  );

  return {
    exercises: exerciseList,
    loading,
    error,
    refresh: refetch,
    getExerciseById,
    addExercise,
    totalCount: exerciseList.length,
  };
}

export default useExercises;
