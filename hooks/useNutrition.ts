import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/client';
import { nutritionLogs, NutritionLog, InsertNutritionLog } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export interface UseNutritionOptions {
  date?: string; // YYYY-MM-DD, defaults to today
}

export function useNutrition(options?: UseNutritionOptions) {
  const targetDate = options?.date || new Date().toISOString().split('T')[0];
  const [dailyLog, setDailyLog] = useState<NutritionLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<NutritionLog[]>([]);
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
        // 1. Fetch record for the requested date
        const single = await db
          .select()
          .from(nutritionLogs)
          .where(eq(nutritionLogs.date, targetDate))
          .limit(1);

        // 2. Fetch past 14 days of logs for trend analytics
        const recent = await db
          .select()
          .from(nutritionLogs)
          .orderBy(desc(nutritionLogs.date))
          .limit(14);

        if (!isCancelled) {
          setDailyLog(single[0] || null);
          setRecentLogs(recent);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[useNutrition] Query error:', err);
        if (!isCancelled) {
          setError(err?.message || 'Failed to query local nutrition logs');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [targetDate, refreshTrigger]);

  const logNutrition = useCallback(
    async (params: {
      date?: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }) => {
      const dateToLog = params.date || targetDate;
      const logId = `nl-${dateToLog}`;

      const payload: InsertNutritionLog = {
        id: logId,
        date: dateToLog,
        calories: Math.max(0, params.calories),
        protein: Math.max(0, params.protein),
        carbs: Math.max(0, params.carbs),
        fats: Math.max(0, params.fats),
      };

      await db
        .insert(nutritionLogs)
        .values(payload)
        .onConflictDoUpdate({
          target: nutritionLogs.id,
          set: {
            calories: payload.calories,
            protein: payload.protein,
            carbs: payload.carbs,
            fats: payload.fats,
          },
        });

      refetch();
    },
    [targetDate, refetch]
  );

  const deleteLog = useCallback(
    async (dateToDelete: string) => {
      await db.delete(nutritionLogs).where(eq(nutritionLogs.date, dateToDelete));
      refetch();
    },
    [refetch]
  );

  return {
    dailyLog,
    recentLogs,
    loading,
    error,
    refresh: refetch,
    logNutrition,
    deleteLog,
  };
}

export default useNutrition;
