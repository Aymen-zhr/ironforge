import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { expoDb } from '../db/client';
import { recordSetCompletion, saveWorkoutSession } from '../services/workoutHistoryService';
import { ironforgeState } from '../services/ironforgeStateStore';

export interface ActiveWorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ActiveWorkoutStore {
  isActive: boolean;
  routineId: string | null;
  routineName: string;
  startTime: string | null;
  notes: string;
  setsData: Record<string, ActiveWorkoutSet[]>;
  exerciseOrder: string[];

  // Actions
  startWorkout: (
    routineId: string,
    routineName: string,
    initialExercises?: { id: string; targetSets?: number; defaultWeight?: number; defaultReps?: number }[]
  ) => void;
  updateSet: (exerciseId: string, setIndex: number, patch: Partial<ActiveWorkoutSet>) => void;
  addSet: (exerciseId: string, defaultWeight?: number, defaultReps?: number) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  setNotes: (notes: string) => void;
  finishWorkout: () => Promise<{ workoutId: string; volumeLoad: number; completedSets: number }>;
  discardWorkout: () => void;
}

const initialState = {
  isActive: false,
  routineId: null,
  routineName: '',
  startTime: null,
  notes: '',
  setsData: {},
  exerciseOrder: [],
};

export const useActiveWorkoutStore = create<ActiveWorkoutStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startWorkout: (routineId, routineName, initialExercises = []) => {
        const initialSetsMap: Record<string, ActiveWorkoutSet[]> = {};
        const order: string[] = [];

        initialExercises.forEach((ex) => {
          order.push(ex.id);
          const count = ex.targetSets || 3;
          const w = ex.defaultWeight || 50;
          const r = ex.defaultReps || 10;
          initialSetsMap[ex.id] = Array.from({ length: count }, (_, idx) => ({
            setNumber: idx + 1,
            weight: w,
            reps: r,
            isCompleted: false,
          }));
        });

        set({
          isActive: true,
          routineId,
          routineName,
          startTime: new Date().toISOString(),
          notes: '',
          setsData: initialSetsMap,
          exerciseOrder: order,
        });
      },

      updateSet: (exerciseId, setIndex, patch) => {
        const currentSets = get().setsData[exerciseId] || [];
        const nextSets = [...currentSets];
        if (nextSets[setIndex]) {
          nextSets[setIndex] = { ...nextSets[setIndex], ...patch };
          set({
            setsData: {
              ...get().setsData,
              [exerciseId]: nextSets,
            },
          });
        }
      },

      addSet: (exerciseId, defaultWeight = 50, defaultReps = 10) => {
        const currentSets = get().setsData[exerciseId] || [];
        const lastSet = currentSets[currentSets.length - 1];
        const newSet: ActiveWorkoutSet = {
          setNumber: currentSets.length + 1,
          weight: lastSet ? lastSet.weight : defaultWeight,
          reps: lastSet ? lastSet.reps : defaultReps,
          isCompleted: false,
        };

        set({
          setsData: {
            ...get().setsData,
            [exerciseId]: [...currentSets, newSet],
          },
        });
      },

      removeSet: (exerciseId, setIndex) => {
        const currentSets = get().setsData[exerciseId] || [];
        const nextSets = currentSets
          .filter((_, idx) => idx !== setIndex)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

        set({
          setsData: {
            ...get().setsData,
            [exerciseId]: nextSets,
          },
        });
      },

      toggleSetCompleted: (exerciseId, setIndex) => {
        const currentSets = get().setsData[exerciseId] || [];
        const nextSets = [...currentSets];
        const target = nextSets[setIndex];
        if (target) {
          const nextCompleted = !target.isCompleted;
          nextSets[setIndex] = {
            ...target,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };

          set({
            setsData: {
              ...get().setsData,
              [exerciseId]: nextSets,
            },
          });
        }
      },

      setNotes: (notes) => set({ notes }),

      finishWorkout: async () => {
        const state = get();
        const workoutId = `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const endTime = new Date().toISOString();
        const startTime = state.startTime || endTime;

        let totalVolume = 0;
        let completedCount = 0;

        // Tally completed sets and volume
        Object.entries(state.setsData).forEach(([_, sets]) => {
          sets.forEach((s) => {
            if (s.isCompleted) {
              completedCount += 1;
              totalVolume += s.weight * s.reps;
            }
          });
        });

        // 1. Atomic Transaction to flush session into local SQLite
        expoDb.withTransactionSync(() => {
          // Write workout master row
          const wStmt = expoDb.prepareSync(`
            INSERT INTO workouts (id, name, start_time, end_time, volume_load, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          try {
            wStmt.executeSync([
              workoutId,
              state.routineName || 'Training Session',
              startTime,
              endTime,
              totalVolume,
              state.notes || null,
            ]);
          } finally {
            wStmt.finalizeSync();
          }

          // Write workout set rows
          const wsStmt = expoDb.prepareSync(`
            INSERT INTO workout_sets (
              id, workout_id, exercise_id, set_number, weight, reps, rpe, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          try {
            Object.entries(state.setsData).forEach(([exId, sets]) => {
              sets.forEach((s, idx) => {
                if (s.isCompleted) {
                  wsStmt.executeSync([
                    `ws-${workoutId}-${exId}-${idx}`,
                    workoutId,
                    exId,
                    s.setNumber || idx + 1,
                    s.weight,
                    s.reps,
                    s.rpe ?? null,
                    s.completedAt || endTime,
                  ]);
                }
              });
            });
          } finally {
            wsStmt.finalizeSync();
          }
        });

        // 2. Sync to historical aggregate services for progressive overload telemetry
        const durationMins = Math.max(
          1,
          Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
        );

        await saveWorkoutSession({
          id: workoutId,
          splitName: state.routineName || 'Session',
          date: endTime.split('T')[0],
          durationMinutes: durationMins,
          totalVolumeKg: totalVolume,
          totalSetsCompleted: completedCount,
          prsAchieved: 0,
        });

        for (const [exId, sets] of Object.entries(state.setsData)) {
          for (const s of sets) {
            if (s.isCompleted) {
              await recordSetCompletion({
                exerciseId: exId,
                exerciseName: exId,
                setNumber: s.setNumber,
                weightKg: s.weight,
                reps: s.reps,
              });
            }
          }
        }

        ironforgeState.finishWorkoutSession();

        // 3. Clear active session in MMKV
        set({ ...initialState });

        return {
          workoutId,
          volumeLoad: totalVolume,
          completedSets: completedCount,
        };
      },

      discardWorkout: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'ironforge-active-workout-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
