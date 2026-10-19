import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { expoDb, db } from './client';
import * as schema from './schema';

export interface DatabaseBackupPayload {
  version: number;
  exportedAt: string;
  database: string;
  data: {
    exercises: schema.Exercise[];
    routines: schema.Routine[];
    routine_exercises: schema.RoutineExercise[];
    workouts: schema.Workout[];
    workout_sets: schema.WorkoutSet[];
    nutrition_logs: schema.NutritionLog[];
    user_profile?: schema.UserProfileEntity[];
    check_in_history?: schema.CheckInRecord[];
  };
}

/**
 * Dumps the entire local SQLite database into a JSON file and prompts sharing via expo-sharing.
 */
export async function exportDatabaseBackup(): Promise<{
  success: boolean;
  fileUri?: string;
  summary: {
    exercises: number;
    routines: number;
    workouts: number;
    workoutSets: number;
    nutritionLogs: number;
    userProfiles?: number;
    checkIns?: number;
  };
  error?: string;
}> {
  try {
    const allExercises = await db.select().from(schema.exercises);
    const allRoutines = await db.select().from(schema.routines);
    const allRoutineExercises = await db.select().from(schema.routineExercises);
    const allWorkouts = await db.select().from(schema.workouts);
    const allWorkoutSets = await db.select().from(schema.workoutSets);
    const allNutritionLogs = await db.select().from(schema.nutritionLogs);
    const allUserProfiles = await db.select().from(schema.userProfile);
    const allCheckIns = await db.select().from(schema.checkInHistory);

    const payload: DatabaseBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      database: 'ironforge.db',
      data: {
        exercises: allExercises,
        routines: allRoutines,
        routine_exercises: allRoutineExercises,
        workouts: allWorkouts,
        workout_sets: allWorkoutSets,
        nutrition_logs: allNutritionLogs,
        user_profile: allUserProfiles,
        check_in_history: allCheckIns,
      },
    };

    const fileName = `ironforge-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${directory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export IronForge Database Backup',
        UTI: 'public.json',
      });
    }

    return {
      success: true,
      fileUri,
      summary: {
        exercises: allExercises.length,
        routines: allRoutines.length,
        workouts: allWorkouts.length,
        workoutSets: allWorkoutSets.length,
        nutritionLogs: allNutritionLogs.length,
      },
    };
  } catch (err: any) {
    console.error('[IronForge DB] Export backup error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to export database backup',
      summary: { exercises: 0, routines: 0, workouts: 0, workoutSets: 0, nutritionLogs: 0 },
    };
  }
}

/**
 * Restores local SQLite database state from a backup JSON payload or file URI.
 */
export async function importDatabaseBackup(jsonStringOrUri: string): Promise<{
  success: boolean;
  summary?: {
    exercises: number;
    routines: number;
    workouts: number;
    workoutSets: number;
    nutritionLogs: number;
    userProfiles?: number;
    checkIns?: number;
  };
  error?: string;
}> {
  try {
    let rawContent = jsonStringOrUri.trim();

    // If string points to a file, read its contents first
    if (rawContent.startsWith('file://') || rawContent.startsWith('/')) {
      rawContent = await FileSystem.readAsStringAsync(rawContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    const payload: DatabaseBackupPayload = JSON.parse(rawContent);

    if (!payload.data) {
      throw new Error('Invalid backup file format: missing data payload');
    }

    const {
      exercises = [],
      routines = [],
      routine_exercises = [],
      workouts = [],
      workout_sets = [],
      nutrition_logs = [],
    } = payload.data;

    // Execute atomic transactional restore
    expoDb.withTransactionSync(() => {
      // 1. Restore exercises
      const exStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO exercises (id, name, primary_muscle, secondary_muscles, mechanic, equipment, cues)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      try {
        for (const ex of exercises) {
          exStmt.executeSync([
            ex.id,
            ex.name,
            ex.primary_muscle,
            typeof ex.secondary_muscles === 'string' ? ex.secondary_muscles : JSON.stringify(ex.secondary_muscles || []),
            ex.mechanic ?? null,
            ex.equipment ?? null,
            typeof ex.cues === 'string' ? ex.cues : JSON.stringify(ex.cues || []),
          ]);
        }
      } finally {
        exStmt.finalizeSync();
      }

      // 2. Restore routines
      const rStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO routines (id, name, created_at, notes)
        VALUES (?, ?, ?, ?)
      `);
      try {
        for (const r of routines) {
          rStmt.executeSync([r.id, r.name, r.created_at, r.notes ?? null]);
        }
      } finally {
        rStmt.finalizeSync();
      }

      // 3. Restore routine exercises
      const reStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO routine_exercises (id, routine_id, exercise_id, order_index, target_sets, target_reps)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      try {
        for (const re of routine_exercises) {
          reStmt.executeSync([re.id, re.routine_id, re.exercise_id, re.order_index, re.target_sets, re.target_reps]);
        }
      } finally {
        reStmt.finalizeSync();
      }

      // 4. Restore workouts
      const wStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO workouts (id, name, start_time, end_time, volume_load, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      try {
        for (const w of workouts) {
          wStmt.executeSync([w.id, w.name, w.start_time, w.end_time ?? null, w.volume_load ?? 0, w.notes ?? null]);
        }
      } finally {
        wStmt.finalizeSync();
      }

      // 5. Restore workout sets
      const wsStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO workout_sets (id, workout_id, exercise_id, set_number, weight, reps, rpe, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      try {
        for (const ws of workout_sets) {
          wsStmt.executeSync([
            ws.id,
            ws.workout_id,
            ws.exercise_id,
            ws.set_number,
            ws.weight,
            ws.reps,
            ws.rpe ?? null,
            ws.completed_at ?? null,
          ]);
        }
      } finally {
        wsStmt.finalizeSync();
      }

      // 6. Restore nutrition logs
      const nStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO nutrition_logs (id, date, calories, protein, carbs, fats)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      try {
        for (const n of nutrition_logs) {
          nStmt.executeSync([n.id, n.date, n.calories, n.protein, n.carbs, n.fats]);
        }
      } finally {
        nStmt.finalizeSync();
      }

      // 7. Restore user profile
      const userProfiles = payload.data.user_profile || [];
      if (userProfiles.length > 0) {
        const upStmt = expoDb.prepareSync(`
          INSERT OR REPLACE INTO user_profile (
            id, gender, age, height_cm, weight_kg, selected_split, goal_phase,
            target_calories, target_protein_g, target_carbs_g, target_fats_g, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        try {
          for (const u of userProfiles) {
            upStmt.executeSync([
              u.id, u.gender, u.age, u.heightCm, u.weightKg, u.selectedSplit, u.goalPhase,
              u.targetCalories, u.targetProteinG, u.targetCarbsG, u.targetFatsG, u.updatedAt
            ]);
          }
        } finally {
          upStmt.finalizeSync();
        }
      }

      // 8. Restore check-in history
      const checkIns = payload.data.check_in_history || [];
      if (checkIns.length > 0) {
        const cStmt = expoDb.prepareSync(`
          INSERT OR REPLACE INTO check_in_history (id, date_string, weight_kg, body_fat_pct, logged_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        try {
          for (const c of checkIns) {
            cStmt.executeSync([c.id, c.dateString, c.weightKg, c.bodyFatPct ?? null, c.loggedAt]);
          }
        } finally {
          cStmt.finalizeSync();
        }
      }
    });

    return {
      success: true,
      summary: {
        exercises: exercises.length,
        routines: routines.length,
        workouts: workouts.length,
        workoutSets: workout_sets.length,
        nutritionLogs: nutrition_logs.length,
        userProfiles: (payload.data.user_profile || []).length,
        checkIns: (payload.data.check_in_history || []).length,
      },
    };
  } catch (err: any) {
    console.error('[IronForge DB] Import backup error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to import database backup',
    };
  }
}
