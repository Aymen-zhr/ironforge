import { expoDb, initDatabaseTables } from './client';
import rawExercises from '../data/exercises.json';
import { PRESET_PROGRAMS, PresetProgram, TemplateExercise } from '../features/workout/templateEngine';

interface SeedExercise {
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
 * Checks if the local SQLite database contains exercises on startup.
 * If empty, seeds movement taxonomy and initial split programs from bundled data.
 */
export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; exerciseCount: number }> {
  initDatabaseTables();

  const existing = expoDb.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );

  if (existing && existing.count > 0) {
    return { seeded: false, exerciseCount: existing.count };
  }

  console.log('[IronForge DB] First boot detected. Seeding movement taxonomy into local SQLite...');

  const exerciseList = rawExercises as SeedExercise[];
  const allRoutines = PRESET_PROGRAMS.flatMap((p: PresetProgram) => p.routines);

  // Temporarily disable foreign keys during bulk seed migration for maximum resilience
  try {
    expoDb.execSync('PRAGMA foreign_keys = OFF;');
  } catch {}

  try {
    // Execute high-throughput batch insert in a single atomic SQLite transaction
    expoDb.withTransactionSync(() => {
      const insertStmt = expoDb.prepareSync(`
        INSERT OR REPLACE INTO exercises (
          id, name, primary_muscle, secondary_muscles, mechanic, equipment, cues
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      try {
        for (const ex of exerciseList) {
          insertStmt.executeSync([
            ex.id,
            ex.name,
            ex.primaryMuscles?.[0] || 'other',
            JSON.stringify(ex.secondaryMuscles || []),
            ex.mechanic || 'isolation',
            ex.equipment || 'body only',
            JSON.stringify(ex.instructions || []),
          ]);
        }

        // Also ensure all preset routine exercises exist in the exercises table
        for (const r of allRoutines) {
          for (const ex of r.exercises) {
            insertStmt.executeSync([
              ex.id,
              ex.name,
              ex.targetMuscle || 'other',
              JSON.stringify([]),
              (ex.mechanic || 'compound').toLowerCase(),
              ex.equipment || 'body only',
              JSON.stringify(ex.executionCue ? [ex.executionCue] : []),
            ]);
          }
        }
      } finally {
        insertStmt.finalizeSync();
      }

      // Seed preset programs and their prescribed exercises
      const routineInsert = expoDb.prepareSync(`
        INSERT OR REPLACE INTO routines (id, name, created_at, notes)
        VALUES (?, ?, ?, ?)
      `);
      const routineExInsert = expoDb.prepareSync(`
        INSERT OR REPLACE INTO routine_exercises (id, routine_id, exercise_id, order_index, target_sets, target_reps)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      try {
        const now = new Date().toISOString();

        for (const r of allRoutines) {
          routineInsert.executeSync([
            r.id,
            r.name,
            now,
            r.subtitle || 'Preset training routine',
          ]);

          r.exercises.forEach((ex: TemplateExercise, idx: number) => {
            routineExInsert.executeSync([
              `re-${r.id}-${idx}`,
              r.id,
              ex.id,
              idx,
              ex.sets,
              ex.repString || '8-12',
            ]);
          });
        }
      } finally {
        routineInsert.finalizeSync();
        routineExInsert.finalizeSync();
      }
    });
  } finally {
    try {
      expoDb.execSync('PRAGMA foreign_keys = ON;');
    } catch {}
  }

  console.log(`[IronForge DB] Local database seeded with ${exerciseList.length} movements.`);
  return { seeded: true, exerciseCount: exerciseList.length };
}
